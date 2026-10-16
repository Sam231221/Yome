import type { Redis } from "ioredis";
import { createLogger } from "@repo/service-kit";
import { getRedisClient } from "@repo/cache";
import type { DomainEvent } from "@repo/contracts";
import { markConsumedIfNew } from "./idempotency.js";

const logger = createLogger("events");

export type EventHandler = (envelope: DomainEvent) => Promise<void>;

/**
 * Generic consumer-group runtime, reusable by any consumer (B14's `notifications`, B15+'s
 * `dashboard-readmodel`/`search-index`, B18+'s `messaging-connections`/`messaging-userprofile`).
 * B13 shipped this machinery unused — its own scope was "publish... to Redis Streams", not
 * "consume"; B14 is the first batch to wire a real consumer (`notifications`) to it.
 *
 * Creates the consumer group at `$` (only new entries) if it doesn't already exist —
 * `BUSYGROUP` (already exists) is swallowed, any other error is rethrown.
 */
export async function ensureConsumerGroup(
  streamKey: string,
  groupName: string,
  redis: Redis = getRedisClient()
): Promise<void> {
  try {
    await redis.xgroup("CREATE", streamKey, groupName, "$", "MKSTREAM");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("BUSYGROUP")) throw error;
  }
}

type StreamEntry = [id: string, fields: string[]];
type ReadGroupResult = Array<[stream: string, entries: StreamEntry[]]>;
type AutoClaimResult = [cursor: string, entries: StreamEntry[], deleted: string[]];

function parseEnvelope(fields: string[]): DomainEvent | null {
  const index = fields.indexOf("envelope");
  if (index === -1 || fields[index + 1] === undefined) return null;
  try {
    return JSON.parse(fields[index + 1]!) as DomainEvent;
  } catch {
    return null;
  }
}

/**
 * Processes one stream entry: idempotency check, `handler`, then `XACK` — always acknowledging
 * *after* the handler's side effect completes (rule 2: "Acknowledge after side effects commit,
 * never before"), so a crash mid-handler leaves the entry pending for `XAUTOCLAIM` recovery.
 * A duplicate is still acknowledged (it has already been handled; leaving it pending would
 * just make `XPENDING` grow forever). An unparseable entry is acknowledged too, to avoid a
 * poison-pill loop — there is no DLQ stream yet (B13 shipped none; there was nothing to fail).
 *
 * Returns `true` if the entry was read (whether handled, skipped-as-duplicate, or dropped as
 * unparseable), `false` only if the handler threw and the entry was left pending.
 */
async function processEntry(
  redis: Redis,
  stream: string,
  groupName: string,
  entryId: string,
  fields: string[],
  handler: EventHandler
): Promise<boolean> {
  const envelope = parseEnvelope(fields);
  if (!envelope) {
    logger.error(
      "Unparseable stream entry; acknowledging to avoid a poison-pill loop",
      undefined,
      { stream, groupName, entryId }
    );
    await redis.xack(stream, groupName, entryId);
    return true;
  }

  try {
    const isNew = await markConsumedIfNew(groupName, envelope.id, redis);
    if (isNew) {
      await handler(envelope);
    }
    await redis.xack(stream, groupName, entryId);
    return true;
  } catch (error) {
    logger.error(
      "Consumer handler failed; entry left pending for XAUTOCLAIM recovery",
      error as Error,
      { stream, groupName, entryId, eventId: envelope.id, type: envelope.type }
    );
    return false;
  }
}

/**
 * One consume pass: reads up to `count` new entries per stream for `consumerName` in
 * `groupName`, and processes each (see `processEntry`). Accepts a single stream key or an
 * array — one `XREADGROUP` spans every stream, so a consumer subscribed to several domains
 * (like `notifications`) gets near-real-time delivery without stacking one `BLOCK` per stream.
 *
 * Returns the number of entries read across all streams (processed + skipped-as-duplicate +
 * dropped-as-unparseable), or 0 if the `BLOCK` window elapsed with nothing new.
 */
export async function consumeOnce(
  streamKey: string | string[],
  groupName: string,
  consumerName: string,
  handler: EventHandler,
  options?: { count?: number; blockMs?: number; redis?: Redis }
): Promise<number> {
  const redis = options?.redis ?? getRedisClient();
  const count = options?.count ?? 10;
  const blockMs = options?.blockMs ?? 1000;
  const streams = Array.isArray(streamKey) ? streamKey : [streamKey];

  const result = (await redis.xreadgroup(
    "GROUP",
    groupName,
    consumerName,
    "COUNT",
    count,
    "BLOCK",
    blockMs,
    "STREAMS",
    ...streams,
    ...streams.map(() => ">")
  )) as ReadGroupResult | null;

  if (!result) return 0;

  let processed = 0;
  for (const [stream, entries] of result) {
    for (const [entryId, fields] of entries) {
      processed += 1;
      await processEntry(redis, stream, groupName, entryId, fields, handler);
    }
  }

  return processed;
}

/**
 * Reclaims entries that another consumer read but never acknowledged (a crash mid-handler),
 * once they have been idle for `minIdleMs`, and re-runs them through `handler`. Rule 4's
 * `XPENDING` / `XCLAIM` recovery, done with `XAUTOCLAIM` (Redis 6.2+) so no separate
 * `XPENDING` scan is needed. Idempotency still applies, so re-running a half-finished entry is
 * safe. Returns the number of entries reclaimed and processed.
 */
export async function reclaimStale(
  streamKey: string | string[],
  groupName: string,
  consumerName: string,
  handler: EventHandler,
  options?: { minIdleMs?: number; count?: number; redis?: Redis }
): Promise<number> {
  const redis = options?.redis ?? getRedisClient();
  const minIdleMs = options?.minIdleMs ?? 30_000;
  const count = options?.count ?? 50;
  const streams = Array.isArray(streamKey) ? streamKey : [streamKey];

  let reclaimed = 0;
  for (const stream of streams) {
    try {
      const [, entries] = (await redis.xautoclaim(
        stream,
        groupName,
        consumerName,
        minIdleMs,
        "0",
        "COUNT",
        count
      )) as AutoClaimResult;

      for (const [entryId, fields] of entries) {
        reclaimed += 1;
        await processEntry(redis, stream, groupName, entryId, fields, handler);
      }
    } catch (error) {
      logger.error("XAUTOCLAIM failed; will retry next cycle", error as Error, {
        stream,
        groupName,
      });
    }
  }

  return reclaimed;
}

/**
 * Long-running consume loop: ensures the group on every stream, then repeatedly reclaims stale
 * pending entries and consumes new ones until `stop()` is called. Intended to run in-process
 * inside a consumer service's bootstrap (`services/notifications` in B14), the mirror of
 * `startRelay` on the publish side. `stop()` returns a promise that resolves once the current
 * cycle has finished, for graceful shutdown.
 */
export function startConsumer(options: {
  streams: string[];
  group: string;
  consumer: string;
  handler: EventHandler;
  redis?: Redis;
  count?: number;
  blockMs?: number;
  reclaimIdleMs?: number;
  /** Delay after a cycle that processed nothing, before the next one. Also the guaranteed
   * event-loop yield so a fast-returning Redis can't starve timers in a hot loop. */
  idleDelayMs?: number;
  onError?: (error: unknown) => void;
}): { stop: () => Promise<void>; ready: Promise<void> } {
  const redis = options.redis ?? getRedisClient();
  const blockMs = options.blockMs ?? 2000;
  const idleDelayMs = options.idleDelayMs ?? 250;
  let stopped = false;

  const sleep = (ms: number) =>
    new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      timer.unref?.();
    });

  // Groups are created at `$` (see `ensureConsumerGroup`), so any event published on a
  // brand-new stream *before* this resolves is not delivered to this group. `ready` lets a
  // caller (or a test) wait for the group to exist before it starts publishing; on a restart
  // the group already exists and its cursor persists, so there is no gap.
  const ready = (async () => {
    for (const stream of options.streams) {
      await ensureConsumerGroup(stream, options.group, redis);
    }
  })();

  const loop = (async () => {
    await ready;

    while (!stopped) {
      try {
        const reclaimed = await reclaimStale(
          options.streams,
          options.group,
          options.consumer,
          options.handler,
          { minIdleMs: options.reclaimIdleMs, redis }
        );
        const processed = await consumeOnce(
          options.streams,
          options.group,
          options.consumer,
          options.handler,
          { count: options.count, blockMs, redis }
        );
        if (reclaimed + processed === 0) await sleep(idleDelayMs);
      } catch (error) {
        logger.error("Consumer loop cycle failed", error as Error, {
          group: options.group,
        });
        options.onError?.(error);
        await sleep(1000);
      }
    }
  })();

  return {
    ready,
    stop: () => {
      stopped = true;
      return loop;
    },
  };
}

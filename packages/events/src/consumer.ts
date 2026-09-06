import type { Redis } from "ioredis";
import { createLogger } from "@repo/service-kit";
import { getRedisClient } from "@repo/cache";
import type { DomainEvent } from "@repo/contracts";
import { markConsumedIfNew } from "./idempotency.js";

const logger = createLogger("events");

export type EventHandler = (envelope: DomainEvent) => Promise<void>;

/**
 * Generic consumer-group runtime, reusable by any future consumer (B14's `notifications`,
 * B18+'s `messaging-connections`/`messaging-userprofile`). B13 ships this machinery without
 * wiring any business consumer to it yet — `event-architecture-plan.md`'s own B13 scope is
 * "publish... to Redis Streams", not "consume"; the Consumer Map's actual groups are B14+.
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
 * One consume pass: reads up to `count` new entries for `consumerName` in `groupName`,
 * checks idempotency, runs `handler`, and acknowledges — always, even when the idempotency
 * check finds a duplicate, since a duplicate has already been (or is being) handled and
 * leaving it pending would just make `XPENDING` grow forever. Acknowledges *after* the
 * handler's side effect completes (rule 2: "Acknowledge after side effects commit, never
 * before"), so a crash mid-handler leaves the entry pending for `XCLAIM` recovery.
 *
 * Returns the number of entries read (processed + skipped-as-duplicate), or 0 if the
 * `BLOCK` window elapsed with nothing new.
 */
export async function consumeOnce(
  streamKey: string,
  groupName: string,
  consumerName: string,
  handler: EventHandler,
  options?: { count?: number; blockMs?: number; redis?: Redis }
): Promise<number> {
  const redis = options?.redis ?? getRedisClient();
  const count = options?.count ?? 10;
  const blockMs = options?.blockMs ?? 1000;

  const result = (await redis.xreadgroup(
    "GROUP",
    groupName,
    consumerName,
    "COUNT",
    count,
    "BLOCK",
    blockMs,
    "STREAMS",
    streamKey,
    ">"
  )) as ReadGroupResult | null;

  if (!result) return 0;

  let processed = 0;
  for (const [, entries] of result) {
    for (const [entryId, fields] of entries) {
      processed += 1;
      const envelope = parseEnvelope(fields);
      if (!envelope) {
        logger.error("Unparseable stream entry; acknowledging to avoid a poison-pill loop", undefined, {
          streamKey,
          groupName,
          entryId,
        });
        await redis.xack(streamKey, groupName, entryId);
        continue;
      }

      try {
        const isNew = await markConsumedIfNew(groupName, envelope.id, redis);
        if (isNew) {
          await handler(envelope);
        }
        await redis.xack(streamKey, groupName, entryId);
      } catch (error) {
        logger.error("Consumer handler failed; entry left pending for XCLAIM recovery", error as Error, {
          streamKey,
          groupName,
          entryId,
          eventId: envelope.id,
          type: envelope.type,
        });
      }
    }
  }

  return processed;
}

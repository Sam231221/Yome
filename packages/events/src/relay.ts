import type { Redis } from "ioredis";
import getPrismaInstance from "@repo/database";
import { getRedisClient } from "@repo/cache";
import { createLogger } from "@repo/service-kit";
import type { DomainEvent } from "@repo/contracts";

const logger = createLogger("events");

type PrismaClient = ReturnType<typeof getPrismaInstance>;

/** Rows past this many failed publish attempts stop being retried and sit in Postgres with
 * `publishedAt` still null, excluded from every future poll — "the DLQ", for this relay:
 * manual inspection, not an automatic replay. See event-architecture-plan.md's relay spec. */
const MAX_ATTEMPTS = 10;
const BATCH_SIZE = 100;
/** Default interval between poll cycles when running the loop via `startRelay`. */
const DEFAULT_POLL_INTERVAL_MS = 200;
/** `XADD ... MAXLEN ~ N` per stream (approximate trimming, cheap). */
const STREAM_MAXLEN = 100_000;

function streamKeyForType(type: string): string {
  const domain = type.split(".")[0] || "unknown";
  return `yome:events:${domain}`;
}

type OutboxRow = {
  id: string;
  type: string;
  version: number;
  subject: string;
  producer: string;
  correlationId: string | null;
  causationId: string | null;
  actorUserId: number | null;
  payload: unknown;
  occurredAt: Date;
  attempts: number;
};

/**
 * One relay pass: claims a batch of unpublished rows, `XADD`s each to its domain stream, and
 * marks it published — all inside one Postgres transaction, so `FOR UPDATE SKIP LOCKED`'s row
 * locks are held for the duration and multiple relay replicas can run concurrently without
 * double-publishing (the transaction that wins the lock is the only one that sees the row at
 * all; every other replica's SKIP LOCKED silently passes over it).
 *
 * A single row's publish failure (e.g. Redis unreachable) does not abort the whole batch: its
 * `attempts`/`lastError` are updated in the same transaction instead, and it's retried on a
 * later poll — up to `MAX_ATTEMPTS`.
 */
export async function relayOnce(
  prisma: PrismaClient = getPrismaInstance(),
  redis: Redis = getRedisClient()
): Promise<{ published: number; failed: number }> {
  let published = 0;
  let failed = 0;

  await prisma.$transaction(async (tx: PrismaClient) => {
    const rows = await tx.$queryRaw<OutboxRow[]>`
      SELECT id, type, version, subject, producer, "correlationId", "causationId",
             "actorUserId", payload, "occurredAt", attempts
      FROM "OutboxEvent"
      WHERE "publishedAt" IS NULL AND attempts < ${MAX_ATTEMPTS}
      ORDER BY "occurredAt"
      LIMIT ${BATCH_SIZE}
      FOR UPDATE SKIP LOCKED
    `;

    for (const row of rows) {
      const envelope: DomainEvent = {
        id: row.id,
        type: row.type,
        version: row.version,
        subject: row.subject,
        producer: row.producer,
        occurredAt: row.occurredAt.toISOString(),
        correlationId: row.correlationId ?? undefined,
        causationId: row.causationId ?? undefined,
        actorUserId: row.actorUserId ?? undefined,
        payload: row.payload,
      };

      try {
        const streamKey = streamKeyForType(row.type);
        await redis.xadd(
          streamKey,
          "MAXLEN",
          "~",
          String(STREAM_MAXLEN),
          "*",
          "envelope",
          JSON.stringify(envelope)
        );
        await tx.outboxEvent.update({
          where: { id: row.id },
          data: { publishedAt: new Date() },
        });
        published += 1;
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : String(error);
        logger.error("Failed to publish outbox event", error as Error, {
          id: row.id,
          type: row.type,
          attempts: row.attempts + 1,
        });
        if (row.attempts + 1 >= MAX_ATTEMPTS) {
          logger.error(
            "Outbox event exceeded max publish attempts; leaving unpublished for manual inspection",
            error as Error,
            { id: row.id, type: row.type }
          );
        }
        await tx.outboxEvent.update({
          where: { id: row.id },
          data: { attempts: { increment: 1 }, lastError: message },
        });
      }
    }
  });

  return { published, failed };
}

/** Starts a self-scheduling poll loop calling `relayOnce` every `pollIntervalMs`. Intended to
 * run in-process inside `services/core` (event-architecture-plan.md's Local Development
 * section: "the outbox relay runs in-process during development"). Returns a `stop()` to
 * cancel it — used by tests and by graceful shutdown. */
export function startRelay(options?: {
  prisma?: PrismaClient;
  redis?: Redis;
  pollIntervalMs?: number;
  onError?: (error: unknown) => void;
}): { stop: () => void } {
  const prisma = options?.prisma ?? getPrismaInstance();
  const redis = options?.redis ?? getRedisClient();
  const pollIntervalMs = options?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const tick = async () => {
    if (stopped) return;
    try {
      await relayOnce(prisma, redis);
    } catch (error) {
      logger.error("Outbox relay tick failed", error as Error);
      options?.onError?.(error);
    }
    if (!stopped) {
      timer = setTimeout(tick, pollIntervalMs);
      timer.unref?.();
    }
  };

  void tick();

  return {
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}

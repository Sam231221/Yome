import type { Redis } from "ioredis";
import { createLogger } from "@repo/service-kit";
import { getRedisClient } from "@repo/cache";

const logger = createLogger("events");

/** Matches data-architecture-plan.md's key table: `yome:consumed:<consumer>:<eventId>`, 24h. */
const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;

const consumedKey = (consumerGroup: string, eventId: string) =>
  `yome:consumed:${consumerGroup}:${eventId}`;

/**
 * Returns `true` the first time a (consumerGroup, eventId) pair is seen, `false` on every
 * repeat — the mandatory idempotency check event-architecture-plan.md's Delivery Guarantees
 * require before a consumer does any side effect. Backed by `SET NX`, which is atomic: two
 * replicas racing on the same event can't both get `true`.
 *
 * Degrades to "treat as new" (returns `true`) on a Redis error rather than throwing — the
 * same fail-open philosophy as `@repo/cache`'s rate limiter. A consumer whose own side effect
 * is naturally idempotent (an `UPSERT` keyed by event id) is unaffected either way; a
 * non-idempotent consumer already violates rule 1 regardless of this helper.
 */
export async function markConsumedIfNew(
  consumerGroup: string,
  eventId: string,
  redis: Redis = getRedisClient()
): Promise<boolean> {
  try {
    const result = await redis.set(
      consumedKey(consumerGroup, eventId),
      "1",
      "EX",
      IDEMPOTENCY_TTL_SECONDS,
      "NX"
    );
    return result === "OK";
  } catch (error) {
    logger.error("Idempotency check failed; treating event as new", error as Error, {
      consumerGroup,
      eventId,
    });
    return true;
  }
}

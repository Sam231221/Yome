import { createHash } from "node:crypto";
import type { Redis } from "ioredis";
import { createLogger } from "@repo/service-kit";
import { getRedisClient } from "./client.js";

const logger = createLogger("cache");

/**
 * Cache-aside (B12): try Redis, compute and store on a miss, and fall straight through to
 * `compute` on any Redis error. Redis is never the system of record — a cold or unreachable
 * cache degrades to "always compute," never to a thrown error or to stale data (a TTL, not
 * Redis availability, is what governs staleness here; event-driven invalidation arrives in
 * B15). Callers are responsible for never putting per-viewer mutable state (`isJoined`,
 * `isSaved`, `isHelpful`, `isFollowing`) into the cached value — cache the shared shape only
 * and resolve viewer-specific flags after reading from cache, every time.
 */
export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
  redis: Redis = getRedisClient()
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    logger.error("Cache read failed; computing directly", error as Error, { key });
  }

  const value = await compute();

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    logger.error("Cache write failed; continuing without caching", error as Error, { key });
  }

  return value;
}

/** Stable hash of a query's own parameters (own enumerable keys, `undefined` values dropped,
 * sorted) — the same logical query always produces the same cache key regardless of property
 * insertion order, and the key stays a fixed short length regardless of a long search string. */
export function hashQuery(query: Record<string, unknown>): string {
  const sortedEntries = Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  const normalized = JSON.stringify(sortedEntries);
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

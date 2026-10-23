import type { Redis } from "ioredis";
import { createLogger } from "@repo/service-kit";

const logger = createLogger("cache");

/**
 * Atomic sliding-window check: evict entries older than the window, count what's left, and
 * (only if under budget) record this request — all in one round trip so concurrent requests
 * from the same key can't race past the limit between a separate COUNT and INSERT.
 *
 * KEYS[1] = the sorted-set key. ARGV: now (ms), window (ms), max requests, a unique member id
 * for this request (the sorted set has no room for duplicate scores otherwise).
 */
const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local max = tonumber(ARGV[3])
local member = ARGV[4]

redis.call("ZREMRANGEBYSCORE", key, 0, now - window)
local count = redis.call("ZCARD", key)
if count >= max then
  return 0
end
redis.call("ZADD", key, now, member)
redis.call("PEXPIRE", key, window)
return 1
`;

export type RateLimitResult = { allowed: boolean };

/**
 * Returns a `checkLimit(key)` function backed by the Redis sliding-window script above.
 * Fails open on any Redis error — a rate limiter that takes down the edge when its own store
 * is unavailable defeats the point of B10's resilience work, and `data-architecture-plan.md`
 * requires the system to tolerate a cold Redis.
 */
export function createSlidingWindowLimiter(
  redis: Redis,
  options: { windowMs: number; maxRequests: number }
) {
  const { windowMs, maxRequests } = options;

  return async function checkLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const member = `${now}-${Math.random().toString(36).slice(2)}`;
    try {
      const result = await redis.eval(
        SLIDING_WINDOW_SCRIPT,
        1,
        key,
        now,
        windowMs,
        maxRequests,
        member
      );
      return { allowed: result === 1 };
    } catch (error) {
      logger.error("Rate limiter Redis call failed; failing open", error as Error, { key });
      return { allowed: true };
    }
  };
}

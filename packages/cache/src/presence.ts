import type { Redis } from "ioredis";
import { createLogger } from "@repo/service-kit";
import { getRedisClient } from "./client.js";

const logger = createLogger("cache");

/** Refreshed by a heartbeat while a socket stays connected (see the messaging service's
 * `attachSocketHandlers`) — not tied to the socket's actual lifetime, so a crashed process
 * self-heals: the key simply expires instead of leaving a phantom online user forever.
 * Read lazily (function, not a module-level constant) for the same reason `getRedisClient()`
 * is lazy: this file is imported before `index.ts`'s own `dotenv.config()` call runs. */
function presenceTtlSeconds(): number {
  const configured = Number(process.env.REDIS_PRESENCE_TTL_SECONDS);
  return Number.isFinite(configured) && configured > 0 ? configured : 60;
}

const presenceKey = (userId: string) => `yome:presence:user:${userId}`;
const ONLINE_INDEX_KEY = "yome:presence:online";
/** Reverse index (userId owning a socket id) — not in data-architecture-plan.md's key table,
 * added because `removeSocketFromOnlineUsers` needs O(1) lookup of "which user does this
 * socket belong to" across replicas; the old in-process Map did this by iterating every user,
 * which doesn't work once presence is shared Redis state instead of one process's memory. */
const socketOwnerKey = (socketId: string) => `yome:presence:socket:${socketId}`;

/**
 * Every function here degrades instead of throwing on a Redis failure — reads return empty,
 * writes are logged and swallowed — per data-architecture-plan.md's explicit risk mitigation:
 * "a degraded mode where presence returns empty rather than erroring." Losing presence during
 * a Redis outage is an acceptable degradation; crashing the socket handlers over it is not.
 *
 * Each function takes an optional `redis` client, defaulting to the shared singleton
 * (`getRedisClient()`, evaluated lazily at call time — never at module load, same hazard B10
 * fixed for `GATEWAY_SHARED_TOKEN`). Tests inject a fake instead of requiring a real Redis.
 */

export async function addOnlineUserSocket(
  userId: string,
  socketId: string,
  redis: Redis = getRedisClient()
): Promise<void> {
  try {
    await redis.sadd(presenceKey(userId), socketId);
    await redis.expire(presenceKey(userId), presenceTtlSeconds());
    await redis.set(socketOwnerKey(socketId), userId, "EX", presenceTtlSeconds());
    await redis.sadd(ONLINE_INDEX_KEY, userId);
  } catch (error) {
    logger.error("Failed to record online presence", error as Error, { userId, socketId });
  }
}

export async function removeOnlineUserSocket(
  userId: string,
  socketId: string,
  redis: Redis = getRedisClient()
): Promise<void> {
  try {
    await redis.srem(presenceKey(userId), socketId);
    await redis.del(socketOwnerKey(socketId));
    const remaining = await redis.scard(presenceKey(userId));
    if (remaining === 0) {
      await redis.srem(ONLINE_INDEX_KEY, userId);
    }
  } catch (error) {
    logger.error("Failed to remove online presence", error as Error, { userId, socketId });
  }
}

export async function removeSocketFromOnlineUsers(
  socketId: string,
  redis: Redis = getRedisClient()
): Promise<void> {
  try {
    const userId = await redis.get(socketOwnerKey(socketId));
    if (!userId) return;
    await removeOnlineUserSocket(userId, socketId, redis);
  } catch (error) {
    logger.error("Failed to resolve socket owner on disconnect", error as Error, { socketId });
  }
}

/** Called on a heartbeat interval while a socket stays connected, to keep its presence key
 * from expiring. See `presenceTtlSeconds()`. */
export async function refreshPresence(
  userId: string,
  socketId: string,
  redis: Redis = getRedisClient()
): Promise<void> {
  try {
    await redis.expire(presenceKey(userId), presenceTtlSeconds());
    await redis.expire(socketOwnerKey(socketId), presenceTtlSeconds());
  } catch (error) {
    logger.error("Failed to refresh presence heartbeat", error as Error, { userId, socketId });
  }
}

export async function getOnlineUserIds(redis: Redis = getRedisClient()): Promise<number[]> {
  try {
    const ids = await redis.smembers(ONLINE_INDEX_KEY);
    return ids.map((id) => Number(id));
  } catch (error) {
    logger.error("Failed to read online user index; degrading to empty", error as Error);
    return [];
  }
}

export async function getOnlineUserSockets(
  userId: string | number,
  redis: Redis = getRedisClient()
): Promise<string[]> {
  try {
    return await redis.smembers(presenceKey(String(userId)));
  } catch (error) {
    logger.error("Failed to read online sockets; degrading to empty", error as Error, {
      userId,
    });
    return [];
  }
}

export async function isUserOnline(
  userId: string | number,
  redis: Redis = getRedisClient()
): Promise<boolean> {
  const sockets = await getOnlineUserSockets(userId, redis);
  return sockets.length > 0;
}

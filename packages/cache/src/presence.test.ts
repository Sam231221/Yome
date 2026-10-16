import test from "node:test";
import assert from "node:assert/strict";
import type { Redis } from "ioredis";
import {
  addOnlineUserSocket,
  getOnlineUserIds,
  getOnlineUserSockets,
  isUserOnline,
  removeOnlineUserSocket,
  removeSocketFromOnlineUsers,
} from "./presence.js";

/** Minimal fake covering only the ioredis commands presence.ts calls. Good enough to verify
 * the key structure and control flow; Lua-script/cluster behavior isn't exercised here — that
 * needs a real Redis, which B11's own validation covers live against docker-compose's Redis. */
class FakeRedis {
  sets = new Map<string, Set<string>>();
  strings = new Map<string, string>();

  async sadd(key: string, member: string): Promise<number> {
    const set = this.sets.get(key) ?? new Set<string>();
    const had = set.has(member);
    set.add(member);
    this.sets.set(key, set);
    return had ? 0 : 1;
  }

  async srem(key: string, member: string): Promise<number> {
    const set = this.sets.get(key);
    if (!set || !set.has(member)) return 0;
    set.delete(member);
    return 1;
  }

  async scard(key: string): Promise<number> {
    return this.sets.get(key)?.size ?? 0;
  }

  async smembers(key: string): Promise<string[]> {
    return Array.from(this.sets.get(key) ?? []);
  }

  async expire(): Promise<number> {
    return 1;
  }

  async set(key: string, value: string): Promise<"OK"> {
    this.strings.set(key, value);
    return "OK";
  }

  async get(key: string): Promise<string | null> {
    return this.strings.get(key) ?? null;
  }

  async del(key: string): Promise<number> {
    const had = this.strings.delete(key);
    return had ? 1 : 0;
  }
}

class ThrowingRedis {
  async sadd(): Promise<number> {
    throw new Error("connection refused");
  }
  async smembers(): Promise<string[]> {
    throw new Error("connection refused");
  }
}

const fakeClient = () => new FakeRedis() as unknown as Redis;

test("addOnlineUserSocket then getOnlineUserSockets/getOnlineUserIds see the new socket", async () => {
  const redis = fakeClient();
  await addOnlineUserSocket("7", "socket-a", redis);

  assert.deepEqual(await getOnlineUserSockets(7, redis), ["socket-a"]);
  assert.deepEqual(await getOnlineUserIds(redis), [7]);
  assert.equal(await isUserOnline(7, redis), true);
});

test("a user with multiple sockets stays online until the last one is removed", async () => {
  const redis = fakeClient();
  await addOnlineUserSocket("3", "socket-a", redis);
  await addOnlineUserSocket("3", "socket-b", redis);

  await removeOnlineUserSocket("3", "socket-a", redis);
  assert.equal(await isUserOnline(3, redis), true);
  assert.deepEqual(await getOnlineUserSockets(3, redis), ["socket-b"]);

  await removeOnlineUserSocket("3", "socket-b", redis);
  assert.equal(await isUserOnline(3, redis), false);
  assert.deepEqual(await getOnlineUserIds(redis), []);
});

test("removeSocketFromOnlineUsers resolves the owning user via the reverse index", async () => {
  const redis = fakeClient();
  await addOnlineUserSocket("11", "socket-x", redis);

  await removeSocketFromOnlineUsers("socket-x", redis);

  assert.equal(await isUserOnline(11, redis), false);
});

test("removeSocketFromOnlineUsers is a no-op for an unknown socket id", async () => {
  const redis = fakeClient();
  await removeSocketFromOnlineUsers("never-connected", redis);
  assert.deepEqual(await getOnlineUserIds(redis), []);
});

test("reads degrade to empty instead of throwing when Redis is unreachable", async () => {
  const redis = new ThrowingRedis() as unknown as Redis;

  assert.deepEqual(await getOnlineUserSockets(1, redis), []);
  assert.deepEqual(await getOnlineUserIds(redis), []);
  assert.equal(await isUserOnline(1, redis), false);
});

test("writes swallow Redis errors instead of throwing", async () => {
  const redis = new ThrowingRedis() as unknown as Redis;
  await assert.doesNotReject(() => addOnlineUserSocket("1", "socket-a", redis));
});

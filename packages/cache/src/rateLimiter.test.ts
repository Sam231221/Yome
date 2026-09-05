import test from "node:test";
import assert from "node:assert/strict";
import type { Redis } from "ioredis";
import { createSlidingWindowLimiter } from "./rateLimiter.js";

class FakeRedis {
  calls: unknown[][] = [];
  private response: number;

  constructor(response: number) {
    this.response = response;
  }

  async eval(...args: unknown[]): Promise<number> {
    this.calls.push(args);
    return this.response;
  }
}

class ThrowingRedis {
  async eval(): Promise<number> {
    throw new Error("connection refused");
  }
}

test("allows the request when the Lua script returns 1", async () => {
  const redis = new FakeRedis(1) as unknown as Redis;
  const checkLimit = createSlidingWindowLimiter(redis, { windowMs: 60_000, maxRequests: 10 });

  const result = await checkLimit("yome:ratelimit:1.2.3.4:/api/chat");

  assert.deepEqual(result, { allowed: true });
});

test("denies the request when the Lua script returns 0", async () => {
  const redis = new FakeRedis(0) as unknown as Redis;
  const checkLimit = createSlidingWindowLimiter(redis, { windowMs: 60_000, maxRequests: 10 });

  const result = await checkLimit("yome:ratelimit:1.2.3.4:/api/chat");

  assert.deepEqual(result, { allowed: false });
});

test("passes the configured window and limit to the script for every call", async () => {
  const fake = new FakeRedis(1);
  const redis = fake as unknown as Redis;
  const checkLimit = createSlidingWindowLimiter(redis, { windowMs: 60_000, maxRequests: 120 });

  await checkLimit("yome:ratelimit:1.2.3.4:/api/chat");

  const [, , key, , windowMs, maxRequests] = fake.calls[0]!;
  assert.equal(key, "yome:ratelimit:1.2.3.4:/api/chat");
  assert.equal(windowMs, 60_000);
  assert.equal(maxRequests, 120);
});

test("fails open (allows the request) when Redis is unreachable", async () => {
  const redis = new ThrowingRedis() as unknown as Redis;
  const checkLimit = createSlidingWindowLimiter(redis, { windowMs: 60_000, maxRequests: 10 });

  const result = await checkLimit("yome:ratelimit:1.2.3.4:/api/chat");

  assert.deepEqual(result, { allowed: true });
});

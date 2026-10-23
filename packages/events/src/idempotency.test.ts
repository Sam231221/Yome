import test from "node:test";
import assert from "node:assert/strict";
import type { Redis } from "ioredis";
import { markConsumedIfNew } from "./idempotency.js";

class FakeRedis {
  strings = new Map<string, string>();

  async set(
    key: string,
    value: string,
    ..._args: unknown[]
  ): Promise<"OK" | null> {
    if (this.strings.has(key)) return null; // NX semantics: refuse if already set
    this.strings.set(key, value);
    return "OK";
  }
}

class ThrowingRedis {
  async set(): Promise<"OK" | null> {
    throw new Error("connection refused");
  }
}

test("returns true the first time an event is seen for a consumer group", async () => {
  const redis = new FakeRedis() as unknown as Redis;
  const isNew = await markConsumedIfNew("notifications", "event-1", redis);
  assert.equal(isNew, true);
});

test("returns false on a repeat of the same (consumerGroup, eventId) pair", async () => {
  const redis = new FakeRedis() as unknown as Redis;
  await markConsumedIfNew("notifications", "event-1", redis);
  const secondTime = await markConsumedIfNew("notifications", "event-1", redis);
  assert.equal(secondTime, false);
});

test("the same event is independently new for two different consumer groups", async () => {
  const redis = new FakeRedis() as unknown as Redis;
  await markConsumedIfNew("notifications", "event-1", redis);
  const forOtherGroup = await markConsumedIfNew("dashboard-readmodel", "event-1", redis);
  assert.equal(forOtherGroup, true);
});

test("degrades to treating the event as new when Redis is unreachable", async () => {
  const redis = new ThrowingRedis() as unknown as Redis;
  const isNew = await markConsumedIfNew("notifications", "event-1", redis);
  assert.equal(isNew, true);
});

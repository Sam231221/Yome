import test from "node:test";
import assert from "node:assert/strict";
import type { Redis } from "ioredis";
import { cacheAside, hashQuery } from "./cacheAside.js";

class FakeRedis {
  strings = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.strings.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<"OK"> {
    this.strings.set(key, value);
    return "OK";
  }
}

class ThrowingRedis {
  async get(): Promise<string | null> {
    throw new Error("connection refused");
  }
  async set(): Promise<"OK"> {
    throw new Error("connection refused");
  }
}

test("computes and caches on a miss, then serves the cached value on a hit", async () => {
  const redis = new FakeRedis() as unknown as Redis;
  let computeCalls = 0;
  const compute = async () => {
    computeCalls += 1;
    return { value: "fresh" };
  };

  const first = await cacheAside("key-1", 60, compute, redis);
  const second = await cacheAside("key-1", 60, compute, redis);

  assert.deepEqual(first, { value: "fresh" });
  assert.deepEqual(second, { value: "fresh" });
  assert.equal(computeCalls, 1, "compute should only run once, on the miss");
});

test("different keys never share a cached value", async () => {
  const redis = new FakeRedis() as unknown as Redis;
  const resultA = await cacheAside("key-a", 60, async () => "A", redis);
  const resultB = await cacheAside("key-b", 60, async () => "B", redis);

  assert.equal(resultA, "A");
  assert.equal(resultB, "B");
});

test("falls through to compute on a read error, and does not throw on a write error", async () => {
  const redis = new ThrowingRedis() as unknown as Redis;
  const result = await cacheAside("key-1", 60, async () => "computed", redis);

  assert.equal(result, "computed");
});

test("hashQuery is stable regardless of key order", () => {
  const a = hashQuery({ subject: "Math", sort: "recent" });
  const b = hashQuery({ sort: "recent", subject: "Math" });

  assert.equal(a, b);
});

test("hashQuery ignores undefined values", () => {
  const a = hashQuery({ subject: "Math", cursor: undefined });
  const b = hashQuery({ subject: "Math" });

  assert.equal(a, b);
});

test("hashQuery distinguishes different queries", () => {
  const a = hashQuery({ subject: "Math" });
  const b = hashQuery({ subject: "Science" });

  assert.notEqual(a, b);
});

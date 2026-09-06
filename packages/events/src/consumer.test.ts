import test from "node:test";
import assert from "node:assert/strict";
import type { Redis } from "ioredis";
import { consumeOnce, ensureConsumerGroup } from "./consumer.js";

class FakeRedis {
  strings = new Map<string, string>();
  acked: Array<[string, string, string]> = [];
  private queuedEntries: Array<[string, string[]]>;
  private streamKey: string;
  groupCreateCalls: unknown[][] = [];

  constructor(streamKey: string, entries: Array<[string, string[]]>) {
    this.streamKey = streamKey;
    this.queuedEntries = entries;
  }

  async set(key: string, value: string, ..._args: unknown[]): Promise<"OK" | null> {
    if (this.strings.has(key)) return null;
    this.strings.set(key, value);
    return "OK";
  }

  async xgroup(...args: unknown[]): Promise<"OK"> {
    this.groupCreateCalls.push(args);
    return "OK";
  }

  async xreadgroup(...args: unknown[]) {
    if (this.queuedEntries.length === 0) return null;
    const entries = this.queuedEntries;
    this.queuedEntries = [];
    return [[this.streamKey, entries]];
  }

  async xack(_stream: string, _group: string, id: string): Promise<number> {
    this.acked.push([_stream, _group, id]);
    return 1;
  }
}

class BusyGroupRedis {
  async xgroup(): Promise<never> {
    throw new Error("BUSYGROUP Consumer Group name already exists");
  }
}

class OtherErrorRedis {
  async xgroup(): Promise<never> {
    throw new Error("NOGROUP no such key");
  }
}

const envelopeFields = (event: Record<string, unknown>) => [
  "envelope",
  JSON.stringify(event),
];

test("ensureConsumerGroup swallows BUSYGROUP (group already exists)", async () => {
  const redis = new BusyGroupRedis() as unknown as Redis;
  await assert.doesNotReject(() => ensureConsumerGroup("stream", "group", redis));
});

test("ensureConsumerGroup rethrows any other error", async () => {
  const redis = new OtherErrorRedis() as unknown as Redis;
  await assert.rejects(() => ensureConsumerGroup("stream", "group", redis));
});

test("consumeOnce calls the handler once per new entry and acknowledges it", async () => {
  const event = { id: "evt-1", type: "community.group.created", payload: {} };
  const redis = new FakeRedis("yome:events:community", [
    ["1-0", envelopeFields(event)],
  ]) as unknown as FakeRedis;

  const handled: unknown[] = [];
  const processed = await consumeOnce(
    "yome:events:community",
    "dashboard-readmodel",
    "consumer-1",
    async (envelope) => {
      handled.push(envelope);
    },
    { redis: redis as unknown as Redis }
  );

  assert.equal(processed, 1);
  assert.equal(handled.length, 1);
  assert.equal((handled[0] as { id: string }).id, "evt-1");
  assert.equal(redis.acked.length, 1);
});

test("consumeOnce still acknowledges a duplicate event without re-running the handler", async () => {
  const event = { id: "evt-dup", type: "community.group.created", payload: {} };
  const redis = new FakeRedis("yome:events:community", [
    ["1-0", envelopeFields(event)],
  ]) as unknown as FakeRedis;
  // Pre-mark as consumed, simulating a redelivery.
  await redis.set("yome:consumed:dashboard-readmodel:evt-dup", "1");

  let handlerCalls = 0;
  await consumeOnce(
    "yome:events:community",
    "dashboard-readmodel",
    "consumer-1",
    async () => {
      handlerCalls += 1;
    },
    { redis: redis as unknown as Redis }
  );

  assert.equal(handlerCalls, 0);
  assert.equal(redis.acked.length, 1, "a duplicate is still acknowledged, not left pending");
});

test("consumeOnce leaves a failing handler's entry unacknowledged for XCLAIM recovery", async () => {
  const event = { id: "evt-fail", type: "community.group.created", payload: {} };
  const redis = new FakeRedis("yome:events:community", [
    ["1-0", envelopeFields(event)],
  ]) as unknown as FakeRedis;

  await consumeOnce(
    "yome:events:community",
    "dashboard-readmodel",
    "consumer-1",
    async () => {
      throw new Error("handler exploded");
    },
    { redis: redis as unknown as Redis }
  );

  assert.equal(redis.acked.length, 0, "a failed handler must not be acknowledged");
});

test("consumeOnce returns 0 when there is nothing new (BLOCK window elapsed)", async () => {
  const redis = new FakeRedis("yome:events:community", []) as unknown as FakeRedis;
  const processed = await consumeOnce(
    "yome:events:community",
    "dashboard-readmodel",
    "consumer-1",
    async () => {},
    { redis: redis as unknown as Redis }
  );
  assert.equal(processed, 0);
});

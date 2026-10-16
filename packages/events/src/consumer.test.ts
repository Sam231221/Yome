import test from "node:test";
import assert from "node:assert/strict";
import type { Redis } from "ioredis";
import {
  consumeOnce,
  ensureConsumerGroup,
  reclaimStale,
  startConsumer,
} from "./consumer.js";

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

class MultiStreamRedis {
  strings = new Map<string, string>();
  acked: Array<[string, string, string]> = [];
  autoclaimed: unknown[][] = [];
  private byStream: Map<string, Array<[string, string[]]>>;

  constructor(entriesByStream: Record<string, Array<[string, string[]]>>) {
    this.byStream = new Map(Object.entries(entriesByStream));
  }

  async set(key: string, value: string, ..._args: unknown[]): Promise<"OK" | null> {
    if (this.strings.has(key)) return null;
    this.strings.set(key, value);
    return "OK";
  }

  async xreadgroup(...args: unknown[]) {
    const streamsIdx = args.indexOf("STREAMS");
    const rest = args.slice(streamsIdx + 1);
    const keys = rest.slice(0, rest.length / 2) as string[];
    const out: Array<[string, Array<[string, string[]]>]> = [];
    for (const key of keys) {
      const entries = this.byStream.get(key);
      if (entries && entries.length) {
        out.push([key, entries]);
        this.byStream.set(key, []);
      }
    }
    return out.length ? out : null;
  }

  async xack(stream: string, group: string, id: string): Promise<number> {
    this.acked.push([stream, group, id]);
    return 1;
  }

  async xautoclaim(...args: unknown[]) {
    this.autoclaimed.push(args);
    const stream = args[0] as string;
    const entries = this.byStream.get(`pending:${stream}`) ?? [];
    this.byStream.set(`pending:${stream}`, []);
    return ["0-0", entries, []];
  }
}

test("consumeOnce spans multiple streams in one XREADGROUP", async () => {
  const redis = new MultiStreamRedis({
    "yome:events:identity": [["1-0", envelopeFields({ id: "i-1", type: "identity.user.registered", payload: {} })]],
    "yome:events:messaging": [["1-0", envelopeFields({ id: "m-1", type: "messaging.message.sent", payload: {} })]],
  });

  const seen: string[] = [];
  const processed = await consumeOnce(
    ["yome:events:identity", "yome:events:messaging"],
    "notifications",
    "notifications-1",
    async (envelope) => {
      seen.push(envelope.id);
    },
    { redis: redis as unknown as Redis }
  );

  assert.equal(processed, 2);
  assert.deepEqual(seen.sort(), ["i-1", "m-1"]);
  assert.equal(redis.acked.length, 2);
});

test("reclaimStale re-runs a stale pending entry through the handler and acknowledges it", async () => {
  const redis = new MultiStreamRedis({
    "pending:yome:events:messaging": [
      ["1-0", envelopeFields({ id: "stale-1", type: "messaging.message.sent", payload: {} })],
    ],
  });

  const seen: string[] = [];
  const reclaimed = await reclaimStale(
    ["yome:events:messaging"],
    "notifications",
    "notifications-1",
    async (envelope) => {
      seen.push(envelope.id);
    },
    { redis: redis as unknown as Redis }
  );

  assert.equal(reclaimed, 1);
  assert.deepEqual(seen, ["stale-1"]);
  assert.equal(redis.acked.length, 1);
  assert.equal(redis.autoclaimed.length, 1);
});

test("reclaimStale skips a stale entry already marked consumed (idempotent replay)", async () => {
  const redis = new MultiStreamRedis({
    "pending:yome:events:messaging": [
      ["1-0", envelopeFields({ id: "dup-1", type: "messaging.message.sent", payload: {} })],
    ],
  });
  await redis.set("yome:consumed:notifications:dup-1", "1");

  let calls = 0;
  await reclaimStale(
    ["yome:events:messaging"],
    "notifications",
    "notifications-1",
    async () => {
      calls += 1;
    },
    { redis: redis as unknown as Redis }
  );

  assert.equal(calls, 0, "a duplicate is not re-handled");
  assert.equal(redis.acked.length, 1, "but it is acknowledged so it stops being pending");
});

test("startConsumer creates the group on every stream and stops cleanly", async () => {
  const created: unknown[][] = [];
  const fake = {
    async xgroup(...args: unknown[]) {
      created.push(args);
      return "OK";
    },
    async xautoclaim() {
      return ["0-0", [], []];
    },
    async xreadgroup() {
      return null;
    },
    async xack() {
      return 1;
    },
  };

  const handle = startConsumer({
    streams: ["yome:events:identity", "yome:events:community"],
    group: "notifications",
    consumer: "notifications-1",
    handler: async () => {},
    redis: fake as unknown as Redis,
    blockMs: 1,
    idleDelayMs: 1,
  });

  await handle.ready;
  await handle.stop();

  assert.equal(created.length, 2);
  assert.deepEqual(
    created.map((args) => args[1]),
    ["yome:events:identity", "yome:events:community"]
  );
});

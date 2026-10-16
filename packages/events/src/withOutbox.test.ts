import test from "node:test";
import assert from "node:assert/strict";
import getPrismaInstance from "@repo/database";
import { withOutbox } from "./withOutbox.js";

type PrismaClient = ReturnType<typeof getPrismaInstance>;

/**
 * A fake Prisma client whose `$transaction` mimics the one property that matters for these
 * tests: if the callback throws, nothing it did should be observable afterward. A real
 * Postgres transaction guarantees this at the database level (proven separately, live,
 * against a disposable instance — see migration-log.md's B13 section); this fake only proves
 * withOutbox's own control flow correctly relies on that guarantee instead of working around
 * it (e.g. by catching errors and still writing the outbox row).
 */
function createFakePrisma(outboxRows: unknown[]) {
  return {
    outboxEvent: {
      create: async ({ data }: { data: unknown }) => {
        outboxRows.push(data);
        return data;
      },
    },
    async $transaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
      // No real rollback semantics here -- just calls straight through. The rollback
      // guarantee itself is Prisma's, not withOutbox's; this fake exists to prove
      // withOutbox never writes an outbox row when `fn` throws, regardless of what the
      // underlying transaction does with any partial domain writes.
      return fn(this);
    },
  } as unknown as PrismaClient;
}

test("writes exactly the outbox rows buildEvents returns, alongside the domain write's result", async () => {
  const outboxRows: unknown[] = [];
  const prisma = createFakePrisma(outboxRows);

  const result = await withOutbox(
    prisma,
    async () => ({ groupId: "g1" }),
    (r) => ({
      type: "community.group.created",
      subject: `group:${r.groupId}`,
      producer: "core",
      payload: { groupId: r.groupId },
    })
  );

  assert.deepEqual(result, { groupId: "g1" });
  assert.equal(outboxRows.length, 1);
  assert.equal((outboxRows[0] as { type: string }).type, "community.group.created");
});

test("supports zero events for a no-op domain write (e.g. already-saved resource)", async () => {
  const outboxRows: unknown[] = [];
  const prisma = createFakePrisma(outboxRows);

  await withOutbox(
    prisma,
    async () => ({ alreadySaved: true }),
    () => null
  );

  assert.equal(outboxRows.length, 0);
});

test("supports multiple events from one domain write", async () => {
  const outboxRows: unknown[] = [];
  const prisma = createFakePrisma(outboxRows);

  await withOutbox(
    prisma,
    async () => ({ conversationCreated: true, messageId: 1 }),
    (r) => [
      {
        type: "messaging.conversation.created",
        subject: "conversation:c1",
        producer: "messaging",
        payload: {},
      },
      {
        type: "messaging.message.sent",
        subject: "conversation:c1",
        producer: "messaging",
        payload: { messageId: r.messageId },
      },
    ]
  );

  assert.equal(outboxRows.length, 2);
});

test("a rolled-back domain transaction writes no outbox row -- fn throwing skips buildEvents entirely", async () => {
  const outboxRows: unknown[] = [];
  const prisma = createFakePrisma(outboxRows);
  let buildEventsCalled = false;

  await assert.rejects(
    () =>
      withOutbox(
        prisma,
        async () => {
          throw new Error("domain write failed");
        },
        () => {
          buildEventsCalled = true;
          return { type: "x", subject: "x", producer: "core", payload: {} };
        }
      ),
    /domain write failed/
  );

  assert.equal(buildEventsCalled, false, "buildEvents must never run when fn throws");
  assert.equal(outboxRows.length, 0);
});

test("buildEvents throwing also aborts -- no outbox row survives a malformed event either", async () => {
  const outboxRows: unknown[] = [];
  const prisma = createFakePrisma(outboxRows);

  await assert.rejects(() =>
    withOutbox(
      prisma,
      async () => ({ ok: true }),
      () => {
        throw new Error("bad event shape");
      }
    )
  );

  assert.equal(outboxRows.length, 0);
});

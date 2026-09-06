import test from "node:test";
import assert from "node:assert/strict";
import { persistNotifications } from "./notificationStore.js";
import type { NotificationSpec } from "../consumer/derive.js";

type Row = {
  id: string;
  eventId: string;
  userId: number;
  type: string;
  title: string;
  body: string;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
};

/** Minimal in-memory Prisma stand-in — just the surface `persistNotifications` touches, with
 * the `(eventId, userId)` uniqueness the real `@@unique` enforces. */
class FakePrisma {
  rows: Row[] = [];
  users = new Map<number, { notificationCount: number }>();
  private seq = 0;

  notification = {
    findUnique: async ({
      where,
    }: {
      where: { eventId_userId: { eventId: string; userId: number } };
    }) => {
      const { eventId, userId } = where.eventId_userId;
      return (
        this.rows.find((r) => r.eventId === eventId && r.userId === userId) ?? null
      );
    },
    create: async ({ data }: { data: Omit<Row, "id" | "readAt" | "createdAt"> }) => {
      const existing = this.rows.find(
        (r) => r.eventId === data.eventId && r.userId === data.userId
      );
      if (existing) {
        throw new Error("Unique constraint failed on the fields: (`eventId`,`userId`)");
      }
      const row: Row = {
        ...data,
        id: `n${++this.seq}`,
        readAt: null,
        createdAt: new Date(),
      };
      this.rows.push(row);
      return row;
    },
    count: async ({ where }: { where: { userId: number; readAt: null } }) =>
      this.rows.filter((r) => r.userId === where.userId && r.readAt === null).length,
  };

  user = {
    update: async ({
      where,
      data,
    }: {
      where: { id: number };
      data: { notificationCount: number };
    }) => {
      this.users.set(where.id, { notificationCount: data.notificationCount });
      return { id: where.id, ...data };
    },
  };

  async $transaction<T>(fn: (tx: FakePrisma) => Promise<T>): Promise<T> {
    return fn(this);
  }
}

const spec = (userId: number): NotificationSpec => ({
  userId,
  type: "community.connection.followed",
  title: "Ada started following you",
  body: "",
  payload: { followerId: 1 },
});

test("persistNotifications creates one row per spec and sets notificationCount", async () => {
  const prisma = new FakePrisma();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const created = await persistNotifications("evt-1", [spec(2)], prisma as any);

  assert.equal(created, 1);
  assert.equal(prisma.rows.length, 1);
  assert.equal(prisma.users.get(2)?.notificationCount, 1);
});

test("replaying the same event creates no duplicate", async () => {
  const prisma = new FakePrisma();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const first = await persistNotifications("evt-dup", [spec(2)], prisma as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const replay = await persistNotifications("evt-dup", [spec(2)], prisma as any);

  assert.equal(first, 1);
  assert.equal(replay, 0, "a redelivered event must not create a second notification");
  assert.equal(prisma.rows.length, 1);
  assert.equal(prisma.users.get(2)?.notificationCount, 1);
});

test("an empty spec list is a no-op", async () => {
  const prisma = new FakePrisma();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const created = await persistNotifications("evt-empty", [], prisma as any);
  assert.equal(created, 0);
  assert.equal(prisma.rows.length, 0);
});

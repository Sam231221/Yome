import getPrismaInstance from "@repo/database";
import type { NotificationSpec } from "../consumer/derive.js";

type PrismaClient = ReturnType<typeof getPrismaInstance>;

export type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  body: string;
  payload: unknown;
  read: boolean;
  createdAt: string;
};

export type NotificationPage = {
  notifications: NotificationRecord[];
  unreadCount: number;
  nextCursor: string | null;
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

function toRecord(row: {
  id: string;
  type: string;
  title: string;
  body: string;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
}): NotificationRecord {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    payload: row.payload,
    read: row.readAt !== null,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Keeps `User.notificationCount` equal to the user's live unread count, in the same
 * transaction as whatever just changed it. This is the field
 * `api-and-dataflow-plan.md` issue #10 flags as a hardcoded schema default (`3`); after B14 it
 * reflects real data.
 */
async function syncUnreadCount(tx: PrismaClient, userId: number): Promise<number> {
  const unread = await tx.notification.count({ where: { userId, readAt: null } });
  await tx.user.update({ where: { id: userId }, data: { notificationCount: unread } });
  return unread;
}

/**
 * Creates one notification per spec, keyed on `(eventId, userId)` so a redelivered event never
 * double-creates — the DB-level backstop to the consumer's Redis idempotency check. Returns
 * how many rows were actually created (0 on a full replay).
 */
export async function persistNotifications(
  eventId: string,
  specs: NotificationSpec[],
  prisma: PrismaClient = getPrismaInstance()
): Promise<number> {
  if (specs.length === 0) return 0;

  return prisma.$transaction(async (tx: PrismaClient) => {
    let created = 0;
    const touchedUsers = new Set<number>();

    for (const spec of specs) {
      const existing = await tx.notification.findUnique({
        where: { eventId_userId: { eventId, userId: spec.userId } },
        select: { id: true },
      });
      if (existing) continue;

      await tx.notification.create({
        data: {
          eventId,
          userId: spec.userId,
          type: spec.type,
          title: spec.title,
          body: spec.body,
          // Notification.payload is a Prisma Json column; @repo/database doesn't re-export the
          // generated Prisma.InputJsonValue type (only getPrismaInstance is exported), and
          // every spec.payload here is a plain JSON-serializable object. Same escape hatch as
          // @repo/events' withOutbox.ts.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload: spec.payload as any,
        },
      });
      created += 1;
      touchedUsers.add(spec.userId);
    }

    for (const userId of touchedUsers) {
      await syncUnreadCount(tx, userId);
    }

    return created;
  });
}

/**
 * `messaging.message.read` handler: when a user reads a message, clear the "new message"
 * notification they may have received for it (event-architecture-plan.md's catalogue:
 * `message.read` -> "notifications (clear pending)"). Naturally idempotent.
 */
export async function clearMessageNotification(
  readerId: number,
  messageId: number,
  prisma: PrismaClient = getPrismaInstance()
): Promise<void> {
  await prisma.$transaction(async (tx: PrismaClient) => {
    const result = await tx.notification.updateMany({
      where: {
        userId: readerId,
        type: "messaging.message.sent",
        readAt: null,
        payload: { path: ["messageId"], equals: messageId },
      },
      data: { readAt: new Date() },
    });
    if (result.count > 0) await syncUnreadCount(tx, readerId);
  });
}

export async function listNotifications(
  userId: number,
  opts: { unreadOnly?: boolean; limit?: number; cursor?: string } = {}
): Promise<NotificationPage> {
  const prisma = getPrismaInstance();
  const limit = Math.min(Math.max(opts.limit ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);

  const rows = await prisma.notification.findMany({
    where: { userId, ...(opts.unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const unreadCount = await prisma.notification.count({
    where: { userId, readAt: null },
  });

  return {
    notifications: page.map(toRecord),
    unreadCount,
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
  };
}

export async function markNotificationRead(
  userId: number,
  id: string
): Promise<{ found: boolean; unreadCount: number }> {
  const prisma = getPrismaInstance();
  return prisma.$transaction(async (tx: PrismaClient) => {
    const updated = await tx.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    const found =
      updated.count > 0 ||
      (await tx.notification.count({ where: { id, userId } })) > 0;
    const unreadCount = await syncUnreadCount(tx, userId);
    return { found, unreadCount };
  });
}

export async function markAllNotificationsRead(userId: number): Promise<number> {
  const prisma = getPrismaInstance();
  return prisma.$transaction(async (tx: PrismaClient) => {
    await tx.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return syncUnreadCount(tx, userId);
  });
}

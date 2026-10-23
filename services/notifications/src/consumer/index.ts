import getPrismaInstance from "@repo/database";
import { isUserOnline } from "@repo/cache";
import { startConsumer, type EventHandler } from "@repo/events";
import { createLogger } from "@repo/service-kit";
import { deriveNotifications, type DeriveContext } from "./derive.js";
import {
  clearMessageNotification,
  persistNotifications,
} from "../store/notificationStore.js";

const logger = createLogger("notifications");

/** Every producing domain's stream (Stream Topology in event-architecture-plan.md). `feed`
 * has no writer yet, so its stream stays empty — harmless to subscribe to. */
const STREAMS = [
  "yome:events:identity",
  "yome:events:community",
  "yome:events:learning",
  "yome:events:feed",
  "yome:events:messaging",
];

/** The Consumer Map's group name for this service. One group across all five streams. */
const GROUP = "notifications";

function buildContext(): DeriveContext {
  const prisma = getPrismaInstance();
  return {
    async getGroupName(groupId) {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { name: true },
      });
      return group?.name ?? null;
    },
    async getUserDisplayName(userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, firstname: true, lastname: true, username: true },
      });
      if (!user) return null;
      const full = `${user.firstname} ${user.lastname}`.trim();
      return user.name?.trim() || full || user.username || null;
    },
    async getResourceAuthor(resourceId) {
      const resource = await prisma.resource.findUnique({
        where: { id: resourceId },
        select: { authorId: true, title: true },
      });
      return resource
        ? { authorId: resource.authorId, title: resource.title }
        : null;
    },
    async isRecipientOnline(userId) {
      return isUserOnline(userId);
    },
  };
}

/** The single handler `startConsumer` runs for every entry on every subscribed stream.
 * Idempotency (`yome:consumed:notifications:<eventId>`) and `XACK` are handled by the runtime;
 * this only has to be correct for a first delivery and safe to skip on a replay. */
export const handleEvent: EventHandler = async (envelope) => {
  if (envelope.type === "messaging.message.read") {
    const payload = envelope.payload as { messageId?: number; readerId?: number };
    if (
      typeof payload.messageId === "number" &&
      typeof payload.readerId === "number"
    ) {
      await clearMessageNotification(payload.readerId, payload.messageId);
    }
    return;
  }

  const specs = await deriveNotifications(envelope, buildContext());
  const created = await persistNotifications(envelope.id, specs);
  if (created > 0) {
    logger.info("Created notifications from event", {
      type: envelope.type,
      eventId: envelope.id,
      created,
    });
  }
};

/** Starts the in-process consume loop. Mirrors `services/core`'s in-process `startRelay`
 * (event-architecture-plan.md: the relay and consumers run in-process during development). */
export function startNotificationConsumer(): {
  stop: () => Promise<void>;
  ready: Promise<void>;
} {
  const handle = startConsumer({
    streams: STREAMS,
    group: GROUP,
    consumer: `notifications-${process.pid}`,
    handler: handleEvent,
    onError: (error) =>
      logger.error("Notification consumer cycle failed", error as Error),
  });
  logger.info("Notification consumer started", { streams: STREAMS, group: GROUP });
  return handle;
}

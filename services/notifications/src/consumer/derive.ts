import type { DomainEvent } from "@repo/contracts";
import {
  communityConnectionFollowedPayloadSchema,
  communityGroupMemberJoinedPayloadSchema,
  identityUserPasswordChangedPayloadSchema,
  identityUserRegisteredPayloadSchema,
  learningResourceMarkedHelpfulPayloadSchema,
  learningResourceSavedPayloadSchema,
  messagingMessageSentPayloadSchema,
} from "@repo/contracts";
import { createLogger } from "@repo/service-kit";

const logger = createLogger("notifications");

/** One notification to create for one recipient. `eventId` is added at persist time from the
 * envelope, so a spec carries only what varies per notification. */
export type NotificationSpec = {
  userId: number;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
};

/** Cross-domain lookups the derivation needs to turn an id-only event payload into a
 * human-readable notification. Still one database in P3, so these are ordinary Prisma reads;
 * injected here so `deriveNotifications` stays unit-testable with fakes. */
export interface DeriveContext {
  getGroupName(groupId: string): Promise<string | null>;
  getUserDisplayName(userId: number): Promise<string | null>;
  getResourceAuthor(
    resourceId: string
  ): Promise<{ authorId: number; title: string } | null>;
  isRecipientOnline(userId: number): Promise<boolean>;
}

const NAME_FALLBACK = "Someone";

/**
 * Maps a domain event to zero or more notifications. Returns `[]` for every event type the
 * `notifications` consumer group subscribes to but does not notify on (`*.group.created`,
 * `learning.resource.created`, `feed.*`, `messaging.conversation.created`, ...) and for events
 * whose referenced aggregate no longer exists. `messaging.message.read` is handled by the
 * consumer directly (it clears a notification rather than creating one), never here.
 *
 * Fan-out cases that would need a membership query (`group.member_joined` -> group admins,
 * `resource.created` -> group members, group messages -> all recipients) are deliberately not
 * emitted yet — event-architecture-plan.md's B14 risk note calls for per-user rate limiting
 * and aggregation windows before those land.
 */
export async function deriveNotifications(
  envelope: DomainEvent,
  ctx: DeriveContext
): Promise<NotificationSpec[]> {
  switch (envelope.type) {
    case "identity.user.registered": {
      const p = identityUserRegisteredPayloadSchema.safeParse(envelope.payload);
      if (!p.success) return warn(envelope);
      return [
        {
          userId: p.data.userId,
          type: envelope.type,
          title: "Welcome to Yome 🎉",
          body: `You're all set, ${p.data.firstname}. Join a group or share a resource to get started.`,
          payload: { username: p.data.username },
        },
      ];
    }

    case "identity.user.password_changed": {
      const p = identityUserPasswordChangedPayloadSchema.safeParse(envelope.payload);
      if (!p.success) return warn(envelope);
      return [
        {
          userId: p.data.userId,
          type: envelope.type,
          title: "Your password was changed",
          body: "If this wasn't you, reset your password immediately and review recent activity.",
          payload: { changedAt: p.data.changedAt },
        },
      ];
    }

    case "community.group.member_joined": {
      const p = communityGroupMemberJoinedPayloadSchema.safeParse(envelope.payload);
      if (!p.success) return warn(envelope);
      const name = await ctx.getGroupName(p.data.groupId);
      if (!name) return [];
      return [
        {
          userId: p.data.userId,
          type: envelope.type,
          title: `You joined ${name}`,
          body: "Introduce yourself and see what the group is working on.",
          payload: { groupId: p.data.groupId, role: p.data.role },
        },
      ];
    }

    case "community.connection.followed": {
      const p = communityConnectionFollowedPayloadSchema.safeParse(envelope.payload);
      if (!p.success) return warn(envelope);
      const name = (await ctx.getUserDisplayName(p.data.followerId)) ?? NAME_FALLBACK;
      return [
        {
          userId: p.data.followeeId,
          type: envelope.type,
          title: `${name} started following you`,
          body: "",
          payload: { followerId: p.data.followerId },
        },
      ];
    }

    case "learning.resource.saved": {
      const p = learningResourceSavedPayloadSchema.safeParse(envelope.payload);
      if (!p.success) return warn(envelope);
      return resourceActorNotification(
        envelope.type,
        p.data.resourceId,
        p.data.userId,
        ctx,
        (name, title) => ({
          title: `${name} saved your resource`,
          body: title,
        })
      );
    }

    case "learning.resource.marked_helpful": {
      const p = learningResourceMarkedHelpfulPayloadSchema.safeParse(envelope.payload);
      if (!p.success) return warn(envelope);
      return resourceActorNotification(
        envelope.type,
        p.data.resourceId,
        p.data.userId,
        ctx,
        (name, title) => ({
          title: `${name} found your resource helpful`,
          body: title,
        })
      );
    }

    case "messaging.message.sent": {
      const p = messagingMessageSentPayloadSchema.safeParse(envelope.payload);
      if (!p.success) return warn(envelope);
      // Group messages (no receiverId) need a membership fan-out — deferred. Direct messages
      // to an online recipient are already delivered over the socket; only notify when the
      // recipient is offline. This is the event that makes `services/notifications` real.
      if (!p.data.receiverId) return [];
      if (await ctx.isRecipientOnline(p.data.receiverId)) return [];
      const name = (await ctx.getUserDisplayName(p.data.senderId)) ?? NAME_FALLBACK;
      return [
        {
          userId: p.data.receiverId,
          type: envelope.type,
          title: `New message from ${name}`,
          body: messageBody(p.data.type),
          payload: {
            conversationId: p.data.conversationId ?? null,
            messageId: p.data.messageId,
            senderId: p.data.senderId,
          },
        },
      ];
    }

    default:
      return [];
  }
}

function messageBody(type: "text" | "image" | "audio"): string {
  if (type === "image") return "Sent a photo";
  if (type === "audio") return "Sent an audio message";
  return "Sent you a message";
}

async function resourceActorNotification(
  type: string,
  resourceId: string,
  actorUserId: number,
  ctx: DeriveContext,
  render: (actorName: string, resourceTitle: string) => { title: string; body: string }
): Promise<NotificationSpec[]> {
  const resource = await ctx.getResourceAuthor(resourceId);
  if (!resource) return [];
  // Don't notify authors about their own saves / helpful marks.
  if (resource.authorId === actorUserId) return [];
  const actorName = (await ctx.getUserDisplayName(actorUserId)) ?? NAME_FALLBACK;
  const { title, body } = render(actorName, resource.title);
  return [
    {
      userId: resource.authorId,
      type,
      title,
      body,
      payload: { resourceId, actorUserId },
    },
  ];
}

function warn(envelope: DomainEvent): NotificationSpec[] {
  logger.error("Event payload failed schema validation; skipping", undefined, {
    type: envelope.type,
    eventId: envelope.id,
  });
  return [];
}

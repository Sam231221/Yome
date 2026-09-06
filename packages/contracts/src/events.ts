import { z } from "zod";

/**
 * The event backbone (B13, see docs/services_packages_refactoring/event-architecture-plan.md).
 *
 * Every event on every Redis Stream carries this envelope; payload shape is per event type,
 * defined below. `id` doubles as the consumer idempotency key (`yome:consumed:<group>:<id>`).
 * `occurredAt` is set at transaction time (when the outbox row is written), not at publish
 * time (when the relay actually `XADD`s it) — the two can differ under relay backpressure.
 */
export type DomainEvent<TPayload = unknown> = {
  id: string;
  type: string;
  version: number;
  subject: string;
  producer: string;
  occurredAt: string;
  correlationId?: string;
  causationId?: string;
  actorUserId?: number;
  payload: TPayload;
};

// ─── identity ────────────────────────────────────────────────────────────

export const identityUserRegisteredPayloadSchema = z.object({
  userId: z.number().int().positive(),
  email: z.string(),
  username: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  createdAt: z.string(),
});

export const identityUserProfileUpdatedPayloadSchema = z.object({
  userId: z.number().int().positive(),
  changed: z.object({
    name: z.string().optional(),
    username: z.string().optional(),
    bio: z.string().optional(),
    address: z.string().optional(),
    profilePicture: z.string().optional(),
  }),
});

export const identityUserPasswordChangedPayloadSchema = z.object({
  userId: z.number().int().positive(),
  changedAt: z.string(),
});

// ─── community ───────────────────────────────────────────────────────────

export const communityGroupCreatedPayloadSchema = z.object({
  groupId: z.string(),
  slug: z.string(),
  name: z.string(),
  subject: z.string(),
  category: z.string(),
  creatorUserId: z.number().int().positive(),
});

export const communityGroupMemberJoinedPayloadSchema = z.object({
  groupId: z.string(),
  userId: z.number().int().positive(),
  role: z.enum(["member", "admin"]),
});

export const communityGroupInvitationCreatedPayloadSchema = z.object({
  invitationId: z.string(),
  groupId: z.string(),
  userId: z.number().int().positive(),
  invitedByUserId: z.number().int().positive(),
});

export const communityGroupAnnouncementPostedPayloadSchema = z.object({
  announcementId: z.string(),
  groupId: z.string(),
  authorId: z.number().int().positive(),
  title: z.string(),
  pinned: z.boolean(),
});

export const communityEventScheduledPayloadSchema = z.object({
  eventId: z.string(),
  groupId: z.string(),
  title: z.string(),
  type: z.string(),
  startsAt: z.string(),
  location: z.string(),
});

export const communityConnectionFollowedPayloadSchema = z.object({
  followerId: z.number().int().positive(),
  followeeId: z.number().int().positive(),
});

export const communityConnectionUnfollowedPayloadSchema =
  communityConnectionFollowedPayloadSchema;

// ─── learning ────────────────────────────────────────────────────────────

export const learningResourceCreatedPayloadSchema = z.object({
  resourceId: z.string(),
  slug: z.string(),
  authorId: z.number().int().positive(),
  groupId: z.string().nullable().optional(),
  subject: z.string(),
  topic: z.string(),
  level: z.string(),
  type: z.string(),
});

export const learningResourceSavedPayloadSchema = z.object({
  resourceId: z.string(),
  userId: z.number().int().positive(),
});

export const learningResourceUnsavedPayloadSchema = learningResourceSavedPayloadSchema;

export const learningResourceMarkedHelpfulPayloadSchema = z.object({
  resourceId: z.string(),
  userId: z.number().int().positive(),
});

export const learningStudyroomStartedPayloadSchema = z.object({
  studyRoomId: z.string(),
  slug: z.string(),
  title: z.string(),
  groupId: z.string().nullable().optional(),
});

export const learningStudyroomParticipantJoinedPayloadSchema = z.object({
  studyRoomId: z.string(),
  userId: z.number().int().positive(),
});

// ─── feed ────────────────────────────────────────────────────────────────

export const feedPostCreatedPayloadSchema = z.object({
  postId: z.string(),
  slug: z.string(),
  authorId: z.number().int().positive(),
  groupId: z.string().nullable().optional(),
  kind: z.string(),
  tags: z.array(z.string()),
});

export const feedPostCommentedPayloadSchema = z.object({
  commentId: z.string(),
  postId: z.string(),
  authorId: z.number().int().positive(),
});

export const feedPostLikedPayloadSchema = z.object({
  postId: z.string(),
  userId: z.number().int().positive(),
});

// ─── messaging ───────────────────────────────────────────────────────────

export const messagingConversationCreatedPayloadSchema = z.object({
  conversationId: z.string(),
  participantAId: z.number().int().positive(),
  participantBId: z.number().int().positive(),
});

export const messagingMessageSentPayloadSchema = z.object({
  messageId: z.number().int().positive(),
  conversationId: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
  senderId: z.number().int().positive(),
  receiverId: z.number().int().positive().nullable().optional(),
  type: z.enum(["text", "image", "audio"]),
  createdAt: z.string(),
});

export const messagingMessageReadPayloadSchema = z.object({
  messageId: z.number().int().positive(),
  readerId: z.number().int().positive(),
  readAt: z.string(),
});

// ─── media ───────────────────────────────────────────────────────────────
// media holds no database access (B09) and is not in B13's outbox-writing scope; the schema
// is defined for contract completeness (event-architecture-plan.md's catalogue lists it) but
// nothing publishes it yet — see migration-log.md's B13 section for why.

export const mediaAssetUploadedPayloadSchema = z.object({
  key: z.string(),
  url: z.string(),
  contentType: z.string(),
  target: z.string(),
  ownerUserId: z.number().int().positive(),
});

/** Every catalogued event type, mapped to its payload schema. Used by the relay to validate
 * on publish and by consumers to validate on receive (event-architecture-plan.md's Schema
 * Evolution rules: "the relay validates on publish; consumers validate on receive and DLQ
 * anything that fails"). */
export const eventPayloadSchemas = {
  "identity.user.registered": identityUserRegisteredPayloadSchema,
  "identity.user.profile_updated": identityUserProfileUpdatedPayloadSchema,
  "identity.user.password_changed": identityUserPasswordChangedPayloadSchema,

  "community.group.created": communityGroupCreatedPayloadSchema,
  "community.group.member_joined": communityGroupMemberJoinedPayloadSchema,
  "community.group.invitation_created": communityGroupInvitationCreatedPayloadSchema,
  "community.group.announcement_posted": communityGroupAnnouncementPostedPayloadSchema,
  "community.event.scheduled": communityEventScheduledPayloadSchema,
  "community.connection.followed": communityConnectionFollowedPayloadSchema,
  "community.connection.unfollowed": communityConnectionUnfollowedPayloadSchema,

  "learning.resource.created": learningResourceCreatedPayloadSchema,
  "learning.resource.saved": learningResourceSavedPayloadSchema,
  "learning.resource.unsaved": learningResourceUnsavedPayloadSchema,
  "learning.resource.marked_helpful": learningResourceMarkedHelpfulPayloadSchema,
  "learning.studyroom.started": learningStudyroomStartedPayloadSchema,
  "learning.studyroom.participant_joined": learningStudyroomParticipantJoinedPayloadSchema,

  "feed.post.created": feedPostCreatedPayloadSchema,
  "feed.post.commented": feedPostCommentedPayloadSchema,
  "feed.post.liked": feedPostLikedPayloadSchema,

  "messaging.conversation.created": messagingConversationCreatedPayloadSchema,
  "messaging.message.sent": messagingMessageSentPayloadSchema,
  "messaging.message.read": messagingMessageReadPayloadSchema,

  "media.asset.uploaded": mediaAssetUploadedPayloadSchema,
} as const;

export type EventType = keyof typeof eventPayloadSchemas;

/** Producers named in the catalogue's "Producer" column — the `producer` envelope field. */
export type EventProducer = "identity" | "core" | "messaging" | "media";

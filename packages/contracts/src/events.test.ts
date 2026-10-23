import test from "node:test";
import assert from "node:assert/strict";
import { eventPayloadSchemas } from "./events.js";

const samplePayloads: Record<string, unknown> = {
  "identity.user.registered": {
    userId: 1,
    email: "a@b.com",
    username: "a",
    firstname: "A",
    lastname: "B",
    createdAt: new Date().toISOString(),
  },
  "identity.user.profile_updated": { userId: 1, changed: { name: "A B" } },
  "identity.user.password_changed": { userId: 1, changedAt: new Date().toISOString() },
  "community.group.created": {
    groupId: "g1",
    slug: "g1",
    name: "Group",
    subject: "Physics",
    category: "Study",
    creatorUserId: 1,
  },
  "community.group.member_joined": { groupId: "g1", userId: 1, role: "member" },
  "community.group.invitation_created": {
    invitationId: "i1",
    groupId: "g1",
    userId: 1,
    invitedByUserId: 2,
  },
  "community.group.announcement_posted": {
    announcementId: "a1",
    groupId: "g1",
    authorId: 1,
    title: "Hi",
    pinned: false,
  },
  "community.event.scheduled": {
    eventId: "e1",
    groupId: "g1",
    title: "Session",
    type: "study",
    startsAt: new Date().toISOString(),
    location: "Room 1",
  },
  "community.connection.followed": { followerId: 1, followeeId: 2 },
  "community.connection.unfollowed": { followerId: 1, followeeId: 2 },
  "learning.resource.created": {
    resourceId: "r1",
    slug: "r1",
    authorId: 1,
    subject: "Physics",
    topic: "Mechanics",
    level: "Beginner",
    type: "Article",
  },
  "learning.resource.saved": { resourceId: "r1", userId: 1 },
  "learning.resource.unsaved": { resourceId: "r1", userId: 1 },
  "learning.resource.marked_helpful": { resourceId: "r1", userId: 1 },
  "learning.studyroom.started": { studyRoomId: "s1", slug: "s1", title: "Room" },
  "learning.studyroom.participant_joined": { studyRoomId: "s1", userId: 1 },
  "feed.post.created": { postId: "p1", slug: "p1", authorId: 1, kind: "Post", tags: [] },
  "feed.post.commented": { commentId: "c1", postId: "p1", authorId: 1 },
  "feed.post.liked": { postId: "p1", userId: 1 },
  "messaging.conversation.created": {
    conversationId: "conv1",
    participantAId: 1,
    participantBId: 2,
  },
  "messaging.message.sent": {
    messageId: 1,
    conversationId: "conv1",
    senderId: 1,
    receiverId: 2,
    type: "text",
    createdAt: new Date().toISOString(),
  },
  "messaging.message.read": {
    messageId: 1,
    readerId: 2,
    readAt: new Date().toISOString(),
  },
  "media.asset.uploaded": {
    key: "k1",
    url: "https://example.com/k1",
    contentType: "image/png",
    target: "chat-image",
    ownerUserId: 1,
  },
};

test("every catalogued event type has a payload schema", () => {
  const types = Object.keys(eventPayloadSchemas);
  assert.equal(types.length, 23);
});

test("every event type has a representative sample payload that parses cleanly", () => {
  for (const [type, schema] of Object.entries(eventPayloadSchemas)) {
    const sample = samplePayloads[type];
    assert.ok(sample, `missing sample payload for ${type}`);
    assert.doesNotThrow(() => schema.parse(sample), `${type} failed to parse its sample`);
  }
});

test("every sample payload is covered by exactly one schema (no orphaned samples)", () => {
  const schemaTypes = new Set(Object.keys(eventPayloadSchemas));
  for (const type of Object.keys(samplePayloads)) {
    assert.ok(schemaTypes.has(type), `sample payload for unknown event type ${type}`);
  }
});

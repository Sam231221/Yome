import test from "node:test";
import assert from "node:assert/strict";
import type { DomainEvent } from "@repo/contracts";
import { deriveNotifications, type DeriveContext } from "./derive.js";

function ctx(overrides: Partial<DeriveContext> = {}): DeriveContext {
  return {
    getGroupName: async () => "Python Learners",
    getUserDisplayName: async () => "Ada Lovelace",
    getResourceAuthor: async () => ({ authorId: 7, title: "Intro to Recursion" }),
    isRecipientOnline: async () => false,
    ...overrides,
  };
}

function envelope(type: string, payload: unknown): DomainEvent {
  return {
    id: "evt-1",
    type,
    version: 1,
    subject: "test",
    producer: "test",
    occurredAt: new Date().toISOString(),
    payload,
  };
}

test("identity.user.registered -> welcome notification to the new user", async () => {
  const specs = await deriveNotifications(
    envelope("identity.user.registered", {
      userId: 42,
      email: "a@b.com",
      username: "ada",
      firstname: "Ada",
      lastname: "Lovelace",
      createdAt: new Date().toISOString(),
    }),
    ctx()
  );
  assert.equal(specs.length, 1);
  assert.equal(specs[0]!.userId, 42);
  assert.match(specs[0]!.title, /Welcome/);
});

test("community.connection.followed -> notification to the followee", async () => {
  const specs = await deriveNotifications(
    envelope("community.connection.followed", { followerId: 1, followeeId: 2 }),
    ctx({ getUserDisplayName: async () => "Grace Hopper" })
  );
  assert.equal(specs.length, 1);
  assert.equal(specs[0]!.userId, 2);
  assert.equal(specs[0]!.title, "Grace Hopper started following you");
});

test("community.group.member_joined -> nothing when the group no longer exists", async () => {
  const specs = await deriveNotifications(
    envelope("community.group.member_joined", {
      groupId: "g1",
      userId: 5,
      role: "member",
    }),
    ctx({ getGroupName: async () => null })
  );
  assert.deepEqual(specs, []);
});

test("learning.resource.saved -> notifies the author, but not for a self-save", async () => {
  const notified = await deriveNotifications(
    envelope("learning.resource.saved", { resourceId: "r1", userId: 9 }),
    ctx()
  );
  assert.equal(notified.length, 1);
  assert.equal(notified[0]!.userId, 7);

  const selfSave = await deriveNotifications(
    envelope("learning.resource.saved", { resourceId: "r1", userId: 7 }),
    ctx()
  );
  assert.deepEqual(selfSave, []);
});

test("messaging.message.sent -> notifies an offline direct recipient only", async () => {
  const offline = await deriveNotifications(
    envelope("messaging.message.sent", {
      messageId: 100,
      conversationId: "c1",
      senderId: 1,
      receiverId: 2,
      type: "text",
      createdAt: new Date().toISOString(),
    }),
    ctx({ isRecipientOnline: async () => false })
  );
  assert.equal(offline.length, 1);
  assert.equal(offline[0]!.userId, 2);

  const online = await deriveNotifications(
    envelope("messaging.message.sent", {
      messageId: 101,
      conversationId: "c1",
      senderId: 1,
      receiverId: 2,
      type: "text",
      createdAt: new Date().toISOString(),
    }),
    ctx({ isRecipientOnline: async () => true })
  );
  assert.deepEqual(online, []);
});

test("messaging.message.sent -> nothing for a group message (no receiverId)", async () => {
  const specs = await deriveNotifications(
    envelope("messaging.message.sent", {
      messageId: 102,
      groupId: "g1",
      senderId: 1,
      type: "text",
      createdAt: new Date().toISOString(),
    }),
    ctx()
  );
  assert.deepEqual(specs, []);
});

test("uncatalogued / non-notifying event types yield nothing", async () => {
  for (const type of [
    "community.group.created",
    "learning.resource.created",
    "feed.post.created",
    "messaging.conversation.created",
  ]) {
    assert.deepEqual(await deriveNotifications(envelope(type, {}), ctx()), []);
  }
});

test("a payload that fails its schema is skipped, not thrown", async () => {
  const specs = await deriveNotifications(
    envelope("identity.user.registered", { userId: "not-a-number" }),
    ctx()
  );
  assert.deepEqual(specs, []);
});

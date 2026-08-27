import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInitialDirectConversationSummaries,
  isMatchingDirectConversation,
  normalizeMessageType,
} from "./direct-messages.js";

test("normalizeMessageType keeps only supported message types", () => {
  assert.equal(normalizeMessageType("audio", "text"), "audio");
  assert.equal(normalizeMessageType("video", "text"), "text");
});

test("isMatchingDirectConversation validates participant ownership", () => {
  assert.equal(
    isMatchingDirectConversation(
      { participantAId: 2, participantBId: 8 },
      8,
      2
    ),
    true
  );
  assert.equal(
    isMatchingDirectConversation(
      { participantAId: 2, participantBId: 8 },
      8,
      9
    ),
    false
  );
});

test("buildInitialDirectConversationSummaries groups by conversation and counts unread items", () => {
  const now = new Date("2026-08-27T10:00:00.000Z");
  const later = new Date("2026-08-27T10:05:00.000Z");

  const result = buildInitialDirectConversationSummaries(
    [
      {
        id: 1,
        conversationId: "conversation-a",
        senderId: 9,
        receiverId: 3,
        message: "latest incoming",
        type: "text",
        messageStatus: "sent",
        createdAt: later,
        sender: {
          name: "Teammate",
          username: "mate",
          identifier: "user",
          userProfile: { bio: "hello", address: "world" },
        },
      },
      {
        id: 2,
        conversationId: "conversation-a",
        senderId: 9,
        receiverId: 3,
        message: "older unread",
        type: "audio",
        messageStatus: "delivered",
        createdAt: now,
        sender: {
          name: "Teammate",
          username: "mate",
          identifier: "user",
        },
      },
      {
        id: 3,
        conversationId: "conversation-b",
        senderId: 3,
        receiverId: 12,
        message: "outgoing",
        type: "image",
        messageStatus: "read",
        createdAt: later,
        receiver: {
          name: "Another",
          username: "another",
          identifier: "user",
        },
      },
    ],
    3
  );

  assert.deepEqual(result.deliveredMessageIds, [1]);
  assert.equal(result.usersWithLatestPrivateMessages.length, 2);
  assert.deepEqual(result.usersWithLatestPrivateMessages[0], {
    conversationId: "conversation-a",
    messageId: 1,
    type: "text",
    message: "latest incoming",
    messageStatus: "sent",
    createdAt: later,
    senderId: 9,
    receiverId: 3,
    id: 9,
    name: "Teammate",
    firstname: undefined,
    lastname: undefined,
    username: "mate",
    email: undefined,
    identifier: "user",
    chatType: "user",
    profilePicture: undefined,
    userProfile: { bio: "hello", address: "world" },
    totalUnreadMessages: 2,
  });
});

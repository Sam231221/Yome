import test from "node:test";
import assert from "node:assert/strict";
import {
  addMediaMessageSchema,
  addMessageSchema,
  directConversationSchema,
  getMessagesSchema,
} from "./chat.validation.js";

test("getMessagesSchema accepts numeric direct chat targets", () => {
  const parsed = getMessagesSchema.params.parse({
    from: "4",
    to: "12",
    chatType: "user",
  });

  assert.deepEqual(parsed, {
    from: "4",
    to: "12",
    chatType: "user",
  });
});

test("getMessagesSchema rejects non-numeric direct chat targets", () => {
  assert.throws(() =>
    getMessagesSchema.params.parse({
      from: "4",
      to: "group-123",
      chatType: "user",
    })
  );
});

test("addMessageSchema distinguishes user and group targets", () => {
  const direct = addMessageSchema.body.parse({
    chatType: "user",
    from: "8",
    to: "14",
    message: "hello",
  });
  const group = addMessageSchema.body.parse({
    chatType: "group",
    from: "8",
    to: "7d3ba4bd-cd8e-4b4c-a83e-1c1cf76af0ba",
    message: "hello group",
  });

  assert.equal(direct.to, 14);
  assert.equal(group.to, "7d3ba4bd-cd8e-4b4c-a83e-1c1cf76af0ba");
});

test("addMediaMessageSchema accepts direct media with a conversationId", () => {
  const parsed = addMediaMessageSchema.body.parse({
    chatType: "user",
    from: "6",
    to: "9",
    url: "https://cdn.example.com/audio.webm",
    type: "audio",
    conversationId: "1f62bdb7-8177-4881-b08d-cd5548448f3e",
  });

  assert.deepEqual(parsed, {
    chatType: "user",
    from: 6,
    to: 9,
    url: "https://cdn.example.com/audio.webm",
    type: "audio",
    conversationId: "1f62bdb7-8177-4881-b08d-cd5548448f3e",
  });
});

test("directConversationSchema requires positive user ids", () => {
  assert.throws(() =>
    directConversationSchema.body.parse({
      from: 0,
      to: 5,
    })
  );
});

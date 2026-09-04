import test from "node:test";
import assert from "node:assert/strict";
import { buildObjectKey } from "./s3.js";

test("buildObjectKey uses conversation-based folders for direct audio uploads", () => {
  const key = buildObjectKey({
    target: "chat-audio",
    chatScope: {
      chatType: "direct",
      conversationId: "Conversation ABC",
    },
    extension: "webm",
    now: new Date("2026-08-27T00:00:00.000Z"),
  });

  assert.match(
    key,
    /^media\/chat\/direct\/conversation-conversation-abc\/messages\/audio\/2026\/08\/27\/[a-f0-9-]+\.webm$/
  );
});

test("buildObjectKey uses group-based folders for group image uploads", () => {
  const key = buildObjectKey({
    target: "chat-image",
    chatScope: {
      chatType: "group",
      groupId: "Team Space",
    },
    extension: "png",
    now: new Date("2026-08-27T00:00:00.000Z"),
  });

  assert.match(
    key,
    /^media\/chat\/groups\/group-team-space\/messages\/images\/2026\/08\/27\/[a-f0-9-]+\.png$/
  );
});

test("buildObjectKey uses user-scoped folders for avatars", () => {
  const key = buildObjectKey({
    target: "profile-avatar",
    entityId: 42,
    extension: "jpg",
    now: new Date("2026-08-27T00:00:00.000Z"),
  });

  assert.match(
    key,
    /^media\/users\/user-42\/avatars\/2026\/08\/[a-f0-9-]+\.jpg$/
  );
});

test("buildObjectKey rejects direct uploads without a conversationId", () => {
  assert.throws(() =>
    buildObjectKey({
      target: "chat-audio",
      chatScope: {
        chatType: "direct",
        conversationId: "   ",
      },
      extension: "webm",
    })
  );
});

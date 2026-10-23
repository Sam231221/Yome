import test from "node:test";
import assert from "node:assert/strict";
import { buildObjectKey, buildS3ClientOptions } from "./s3.js";

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

test("buildS3ClientOptions leaves endpoint and path-style unset for plain AWS S3", () => {
  const options = buildS3ClientOptions({
    region: "us-east-1",
    accessKeyId: "key",
    secretAccessKey: "secret",
    forcePathStyle: false,
  });

  assert.equal(options.endpoint, undefined);
  assert.equal(options.forcePathStyle, undefined);
});

test("buildS3ClientOptions passes a custom endpoint and path-style for S3-compatible providers", () => {
  const options = buildS3ClientOptions({
    region: "ap-south-1",
    accessKeyId: "key",
    secretAccessKey: "secret",
    endpoint: "https://abc.storage.supabase.co/storage/v1/s3",
    forcePathStyle: true,
  });

  assert.equal(options.endpoint, "https://abc.storage.supabase.co/storage/v1/s3");
  assert.equal(options.forcePathStyle, true);
});

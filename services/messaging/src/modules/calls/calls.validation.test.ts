import test from "node:test";
import assert from "node:assert/strict";
import {
  callParticipantsSchema,
  prepareDirectCallConversationSchema,
  validateDirectConversationSchema,
} from "./calls.validation.js";

test("direct call schemas validate participants and conversation ownership fields", () => {
  const prepared = prepareDirectCallConversationSchema.body.parse({
    callerId: "4",
    peerId: "12",
  });
  const validated = validateDirectConversationSchema.body.parse({
    callerId: "4",
    peerId: "12",
    conversationId: "conversation-123",
  });

  assert.deepEqual(prepared, {
    callerId: 4,
    peerId: 12,
  });
  assert.deepEqual(validated, {
    callerId: 4,
    peerId: 12,
    conversationId: "conversation-123",
  });
  assert.throws(() =>
    prepareDirectCallConversationSchema.body.parse({
      callerId: "0",
      peerId: "12",
    })
  );
});

test("callParticipantsSchema no longer requires client-supplied seed users", () => {
  const withoutUsers = callParticipantsSchema.body.parse({
    callerId: "4",
    peerId: "12",
    conversationId: "conversation-123",
  });
  assert.equal(withoutUsers.users, undefined);

  const legacy = callParticipantsSchema.body.parse({
    callerId: "4",
    peerId: "12",
    conversationId: "conversation-123",
    users: [{ id: 4, name: "Caller" }],
  });
  assert.equal(legacy.users?.length, 1);

  assert.throws(() =>
    callParticipantsSchema.body.parse({
      callerId: "4",
      peerId: "12",
      conversationId: "",
    })
  );
});

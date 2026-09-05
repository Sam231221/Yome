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

test("callParticipantsSchema requires at least one seed user", () => {
  const parsed = callParticipantsSchema.body.parse({
    callerId: "4",
    peerId: "12",
    conversationId: "conversation-123",
    users: [
      { id: 4, name: "Caller" },
      { id: "12", name: "Peer", image: null },
    ],
  });

  assert.equal(parsed.users.length, 2);
  assert.throws(() =>
    callParticipantsSchema.body.parse({
      callerId: "4",
      peerId: "12",
      conversationId: "conversation-123",
      users: [],
    })
  );
});

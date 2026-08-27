import test from "node:test";
import assert from "node:assert/strict";
import {
  getDirectConversation,
  getOrCreateDirectConversation,
  normalizeDirectConversationParticipants,
} from "./conversations.js";

test("normalizeDirectConversationParticipants sorts user ids", () => {
  assert.deepEqual(normalizeDirectConversationParticipants(9, 3), {
    participantAId: 3,
    participantBId: 9,
  });
});

test("getDirectConversation looks up the normalized participant pair", async () => {
  const prisma = {
    conversation: {
      findUnique: async (args: unknown) => args,
    },
  } as Parameters<typeof getDirectConversation>[0];

  const result = await getDirectConversation(prisma, 8, 2);

  assert.deepEqual(result, {
    where: {
      participantAId_participantBId: {
        participantAId: 2,
        participantBId: 8,
      },
    },
  });
});

test("getOrCreateDirectConversation returns an existing conversation when found", async () => {
  const existingConversation = { id: "conversation-1" };
  const prisma = {
    conversation: {
      findUnique: async () => existingConversation,
      create: async () => {
        throw new Error("create should not be called");
      },
      findUniqueOrThrow: async () => {
        throw new Error("findUniqueOrThrow should not be called");
      },
    },
  } as Parameters<typeof getOrCreateDirectConversation>[0];

  const result = await getOrCreateDirectConversation(prisma, 3, 7);

  assert.equal(result, existingConversation);
});

test("getOrCreateDirectConversation creates a normalized conversation when missing", async () => {
  const prisma = {
    conversation: {
      findUnique: async () => null,
      create: async (args: unknown) => args,
      findUniqueOrThrow: async () => {
        throw new Error("findUniqueOrThrow should not be called");
      },
    },
  } as Parameters<typeof getOrCreateDirectConversation>[0];

  const result = await getOrCreateDirectConversation(prisma, 11, 4);

  assert.deepEqual(result, {
    data: {
      participantA: { connect: { id: 4 } },
      participantB: { connect: { id: 11 } },
    },
  });
});

test("getOrCreateDirectConversation falls back to lookup on a create race", async () => {
  const recoveredConversation = { id: "conversation-2" };
  const prisma = {
    conversation: {
      findUnique: async () => null,
      create: async () => {
        throw new Error("unique constraint");
      },
      findUniqueOrThrow: async () => recoveredConversation,
    },
  } as Parameters<typeof getOrCreateDirectConversation>[0];

  const result = await getOrCreateDirectConversation(prisma, 5, 10);

  assert.equal(result, recoveredConversation);
});

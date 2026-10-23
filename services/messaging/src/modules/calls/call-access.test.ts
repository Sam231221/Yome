import test from "node:test";
import assert from "node:assert/strict";
import { canCallPeer, type CallAccessPrisma } from "./call-access.js";

const fakePrisma = (followCount: number, messageCount: number) => {
  const calls = { user: 0, messages: 0 };
  const prisma: CallAccessPrisma = {
    user: {
      count: async () => {
        calls.user += 1;
        return followCount;
      },
    },
    messages: {
      count: async () => {
        calls.messages += 1;
        return messageCount;
      },
    },
  };
  return { prisma, calls };
};

test("canCallPeer allows a follow in either direction without checking messages", async () => {
  const { prisma, calls } = fakePrisma(1, 0);
  assert.equal(await canCallPeer(prisma, 1, 2), true);
  assert.equal(calls.messages, 0);
});

test("canCallPeer allows people who have already exchanged direct messages", async () => {
  const { prisma } = fakePrisma(0, 3);
  assert.equal(await canCallPeer(prisma, 1, 2), true);
});

test("canCallPeer rejects strangers and self-calls", async () => {
  assert.equal(await canCallPeer(fakePrisma(0, 0).prisma, 1, 2), false);
  const { prisma, calls } = fakePrisma(5, 5);
  assert.equal(await canCallPeer(prisma, 7, 7), false);
  assert.equal(calls.user, 0);
});

import type getPrismaInstance from "@repo/database";

type PrismaClient = ReturnType<typeof getPrismaInstance>;

export function normalizeDirectConversationParticipants(
  leftUserId: number,
  rightUserId: number
) {
  return leftUserId < rightUserId
    ? { participantAId: leftUserId, participantBId: rightUserId }
    : { participantAId: rightUserId, participantBId: leftUserId };
}

/**
 * Returns `{ conversation, created }` rather than just the conversation -- `created`
 * distinguishes "found an existing one" from "just made one," which is exactly the
 * information every caller needs to decide whether to publish
 * `messaging.conversation.created` (see calls.controller.ts / messages.controller.ts's
 * withOutbox wiring, B13).
 */
export async function getOrCreateDirectConversation(
  prisma: PrismaClient,
  leftUserId: number,
  rightUserId: number
): Promise<{ conversation: Awaited<ReturnType<PrismaClient["conversation"]["create"]>>; created: boolean }> {
  const pair = normalizeDirectConversationParticipants(leftUserId, rightUserId);

  const existing = await prisma.conversation.findUnique({
    where: {
      participantAId_participantBId: {
        participantAId: pair.participantAId,
        participantBId: pair.participantBId,
      },
    },
  });

  if (existing) {
    return { conversation: existing, created: false };
  }

  try {
    const conversation = await prisma.conversation.create({
      data: {
        participantA: { connect: { id: pair.participantAId } },
        participantB: { connect: { id: pair.participantBId } },
      },
    });
    return { conversation, created: true };
  } catch {
    const conversation = await prisma.conversation.findUniqueOrThrow({
      where: {
        participantAId_participantBId: {
          participantAId: pair.participantAId,
          participantBId: pair.participantBId,
        },
      },
    });
    return { conversation, created: false };
  }
}

export async function getDirectConversation(
  prisma: PrismaClient,
  leftUserId: number,
  rightUserId: number
) {
  const pair = normalizeDirectConversationParticipants(leftUserId, rightUserId);

  return prisma.conversation.findUnique({
    where: {
      participantAId_participantBId: {
        participantAId: pair.participantAId,
        participantBId: pair.participantBId,
      },
    },
  });
}

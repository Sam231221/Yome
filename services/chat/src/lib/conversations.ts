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

export async function getOrCreateDirectConversation(
  prisma: PrismaClient,
  leftUserId: number,
  rightUserId: number
) {
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
    return existing;
  }

  try {
    return await prisma.conversation.create({
      data: {
        participantA: { connect: { id: pair.participantAId } },
        participantB: { connect: { id: pair.participantBId } },
      },
    });
  } catch {
    return prisma.conversation.findUniqueOrThrow({
      where: {
        participantAId_participantBId: {
          participantAId: pair.participantAId,
          participantBId: pair.participantBId,
        },
      },
    });
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

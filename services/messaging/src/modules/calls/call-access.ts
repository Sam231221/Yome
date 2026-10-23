type CountArgs = { where: Record<string, unknown> };

/** The two queries `canCallPeer` needs; typed narrowly so tests can pass a fake. */
export type CallAccessPrisma = {
  user: { count: (args: CountArgs) => Promise<number> };
  messages: { count: (args: CountArgs) => Promise<number> };
};

/**
 * A 1:1 call is allowed when the two people already know each other: either one follows
 * the other, or they have exchanged at least one direct message. Requiring the *caller* to
 * follow the peer (the previous rule) blocked calls between people who were happily
 * chatting, since direct messages themselves are not follow-gated.
 */
export async function canCallPeer(
  prisma: CallAccessPrisma,
  callerId: number,
  peerId: number
): Promise<boolean> {
  if (callerId === peerId) return false;

  const followCount = await prisma.user.count({
    where: {
      OR: [
        { id: callerId, following: { some: { id: peerId } } },
        { id: peerId, following: { some: { id: callerId } } },
      ],
    },
  });
  if (followCount > 0) return true;

  const directMessageCount = await prisma.messages.count({
    where: {
      msgType: "user",
      OR: [
        { senderId: callerId, receiverId: peerId },
        { senderId: peerId, receiverId: callerId },
      ],
    },
  });
  return directMessageCount > 0;
}

export const CALL_NOT_ALLOWED_ERROR =
  "You can only call people you follow, who follow you, or who you've already messaged.";

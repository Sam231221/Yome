type SupportedMessageType = "text" | "image" | "audio";

type DirectConversationRecord = {
  participantAId: number;
  participantBId: number;
};

type DirectMessageRecord = {
  id: number;
  conversationId: string | null;
  senderId: number;
  receiverId: number | null;
  message: string;
  type: SupportedMessageType;
  messageStatus: "sent" | "delivered" | "read";
  createdAt: Date;
  sender?: {
    name?: string | null;
    firstname?: string | null;
    lastname?: string | null;
    username?: string | null;
    email?: string | null;
    identifier?: string | null;
    profilePicture?: string | null;
    userProfile?: {
      bio?: string | null;
      address?: string | null;
    } | null;
  } | null;
  receiver?: {
    name?: string | null;
    firstname?: string | null;
    lastname?: string | null;
    username?: string | null;
    email?: string | null;
    identifier?: string | null;
    profilePicture?: string | null;
    userProfile?: {
      bio?: string | null;
      address?: string | null;
    } | null;
  } | null;
};

export function normalizeMessageType(
  type: unknown,
  fallback: SupportedMessageType
): SupportedMessageType {
  return type === "image" || type === "audio" || type === "text" ? type : fallback;
}

export function buildLegacyDirectConversationKey(
  leftUserId: number,
  rightUserId: number
) {
  const ordered = [leftUserId, rightUserId].sort((left, right) => left - right);
  return `direct-${ordered[0]}-${ordered[1]}`;
}

export function isMatchingDirectConversation(
  conversation: DirectConversationRecord,
  fromId: number,
  toId: number
) {
  const [participantAId, participantBId] =
    fromId < toId ? [fromId, toId] : [toId, fromId];

  return (
    conversation.participantAId === participantAId &&
    conversation.participantBId === participantBId
  );
}

export function buildInitialDirectConversationSummaries(
  messages: DirectMessageRecord[],
  userId: number
) {
  const conversations = new Map<
    string,
    Record<string, unknown> & { totalUnreadMessages?: number }
  >();
  const deliveredMessageIds: number[] = [];

  for (const msg of messages) {
    const conversationKey =
      msg.conversationId ??
      buildLegacyDirectConversationKey(msg.senderId, msg.receiverId ?? userId);

    const isSender = msg.senderId === userId;
    const otherParticipantId = isSender ? msg.receiverId : msg.senderId;
    if (!otherParticipantId) continue;

    if (msg.messageStatus === "sent" && msg.receiverId === userId) {
      deliveredMessageIds.push(msg.id);
    }

    if (!conversations.has(conversationKey)) {
      const otherParticipant = isSender ? msg.receiver : msg.sender;

      conversations.set(conversationKey, {
        conversationId: msg.conversationId,
        messageId: msg.id,
        type: msg.type,
        message: msg.message,
        messageStatus: msg.messageStatus,
        createdAt: msg.createdAt,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        id: otherParticipantId,
        name: otherParticipant?.name ?? "",
        firstname: otherParticipant?.firstname ?? undefined,
        lastname: otherParticipant?.lastname ?? undefined,
        username: otherParticipant?.username ?? undefined,
        email: otherParticipant?.email ?? undefined,
        identifier:
          otherParticipant?.identifier === "group" ? "group" : "user",
        chatType: "user",
        profilePicture: otherParticipant?.profilePicture ?? undefined,
        userProfile: otherParticipant?.userProfile ?? undefined,
        totalUnreadMessages:
          !isSender && msg.messageStatus !== "read" ? 1 : 0,
      });
      continue;
    }

    if (!isSender && msg.messageStatus !== "read") {
      const existing = conversations.get(conversationKey)!;
      existing.totalUnreadMessages = (existing.totalUnreadMessages ?? 0) + 1;
    }
  }

  return {
    usersWithLatestPrivateMessages: Array.from(conversations.values()),
    deliveredMessageIds,
  };
}

export type { DirectMessageRecord, SupportedMessageType };

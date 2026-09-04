import type { Call } from "@stream-io/video-react-sdk";
import type {
  DirectCallCustomData,
  DirectCallDescriptor,
  DirectCallMode,
} from "@/features/direct-call/types";

const isDirectCallMode = (value: unknown): value is DirectCallMode =>
  value === "audio" || value === "video";

const toRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

export const parseDirectCallCustomData = (
  value: unknown
): DirectCallCustomData | null => {
  const record = toRecord(value);
  if (!record) return null;

  const callScope = record.callScope;
  const conversationId = record.conversationId;
  const starterUserId = record.starterUserId;
  const initialMode = record.initialMode;
  const currentMode = record.currentMode;

  if (callScope !== "direct-chat") return null;
  if (typeof conversationId !== "string" || conversationId.length === 0) {
    return null;
  }
  if (typeof starterUserId !== "string" || starterUserId.length === 0) {
    return null;
  }
  if (!isDirectCallMode(initialMode)) return null;
  if (typeof currentMode !== "undefined" && !isDirectCallMode(currentMode)) {
    return null;
  }

  return {
    callScope,
    conversationId,
    starterUserId,
    initialMode,
    currentMode,
  };
};

export const getCallMemberIds = (call: Call) =>
  call.state.members
    .map((member) => {
      const userId =
        "user_id" in member && typeof member.user_id === "string"
          ? member.user_id
          : "user" in member &&
              member.user &&
              typeof member.user === "object" &&
              "id" in member.user &&
              typeof member.user.id === "string"
            ? member.user.id
            : null;
      return userId;
    })
    .filter((value): value is string => Boolean(value));

export const getDirectCallPeerSnapshot = (
  call: Call,
  currentUserId: number
): { userId: number; name?: string } | null => {
  for (const member of call.state.members) {
    const userId =
      "user_id" in member && typeof member.user_id === "string"
        ? member.user_id
        : "user" in member &&
            member.user &&
            typeof member.user === "object" &&
            "id" in member.user &&
            typeof member.user.id === "string"
          ? member.user.id
          : null;

    if (!userId || userId === String(currentUserId)) continue;

    const name =
      "name" in member && typeof member.name === "string"
        ? member.name
        : "user" in member &&
            member.user &&
            typeof member.user === "object" &&
            "name" in member.user &&
            typeof member.user.name === "string"
          ? member.user.name
          : undefined;

    return {
      userId: Number(userId),
      name,
    };
  }

  return null;
};

export const isRelevantDirectCall = (call: Call, currentUserId?: number) => {
  const custom = parseDirectCallCustomData(call.state.custom);
  if (!custom) return false;
  if (!currentUserId) return true;
  const memberIds = getCallMemberIds(call);
  return memberIds.includes(String(currentUserId));
};

export const buildDirectCallDescriptor = (
  call: Call,
  currentUserId: number
): DirectCallDescriptor | null => {
  const custom = parseDirectCallCustomData(call.state.custom);
  if (!custom) return null;

  const peer = getDirectCallPeerSnapshot(call, currentUserId);
  if (!peer) return null;

  return {
    conversationId: custom.conversationId,
    callId: call.id,
    initialMode: custom.initialMode,
    peerUserId: peer.userId,
    peerName: peer.name,
  };
};

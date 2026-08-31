"use client";

import type { StreamVideoClient } from "@stream-io/video-react-sdk";
import type { ChatListItem, ConversationId, UserId } from "@/types/chat";
import type { AppUserInfo } from "@/lib/auth/userInfo";
import { getOrCreateDirectConversation } from "@/lib/chat/chatApi";
import { resolveChatKind } from "@/types/chat";
import type { DirectCallDescriptor, DirectCallMode } from "./types";
import { ensureDirectCallUsers } from "@/actions/stream.actions";

const DIRECT_CALL_TYPE = "default";

const resolveConversationId = async (
  callerId: UserId,
  peer: ChatListItem
): Promise<ConversationId | null> => {
  if (peer.conversationId) return peer.conversationId;
  if (typeof peer.id !== "number") return null;
  const conversation = await getOrCreateDirectConversation(callerId, peer.id);
  return conversation?.id ?? null;
};

export const createDirectCall = async ({
  client,
  caller,
  peer,
  initialMode,
}: {
  client: StreamVideoClient;
  caller: AppUserInfo;
  peer: ChatListItem;
  initialMode: DirectCallMode;
}): Promise<DirectCallDescriptor> => {
  if (resolveChatKind(peer) !== "user" || typeof peer.id !== "number") {
    throw new Error("Calls are only available for one-to-one chats.");
  }

  const conversationId = await resolveConversationId(caller.id, peer);
  if (!conversationId) {
    throw new Error("Unable to prepare a direct conversation for this call.");
  }

  await ensureDirectCallUsers({
    callerId: caller.id,
    peerId: peer.id,
    conversationId,
    users: [
      {
        id: caller.id,
        name:
          caller.username ||
          caller.name ||
          `${caller.firstname ?? ""} ${caller.lastname ?? ""}`.trim(),
        image: caller.profilePicture,
      },
      {
        id: peer.id,
        name: peer.name,
        image: peer.profilePicture,
      },
    ],
  });

  const callId = crypto.randomUUID();
  const call = client.call(DIRECT_CALL_TYPE, callId);

  await call.getOrCreate({
    ring: true,
    video: initialMode === "video",
    data: {
      members: [
        { user_id: String(caller.id) },
        { user_id: String(peer.id) },
      ],
      custom: {
        callScope: "direct-chat",
        conversationId,
        starterUserId: String(caller.id),
        initialMode,
        currentMode: initialMode,
      },
    },
  });

  return {
    conversationId,
    callId,
    direction: "outgoing",
    initialMode,
    peerUserId: peer.id,
  };
};

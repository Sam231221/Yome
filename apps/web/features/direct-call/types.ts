import type { ConversationId, UserId } from "@/types/chat-contracts";

export type DirectCallMode = "audio" | "video";

export type DirectCallDescriptor = {
  conversationId: ConversationId;
  callId: string;
  initialMode: DirectCallMode;
  peerUserId: UserId;
  peerName?: string;
};

export type DirectCallCustomData = {
  callScope: "direct-chat";
  conversationId: ConversationId;
  starterUserId: string;
  initialMode: DirectCallMode;
  currentMode?: DirectCallMode;
};

import type { ConversationId, UserId } from "@/types/chat";

export type DirectCallMode = "audio" | "video";
export type DirectCallDirection = "incoming" | "outgoing";

export type DirectCallDescriptor = {
  conversationId: ConversationId;
  callId: string;
  direction: DirectCallDirection;
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

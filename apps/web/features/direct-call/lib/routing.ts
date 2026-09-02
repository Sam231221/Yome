import type { ConversationId } from "@/types/chat-contracts";

export const buildDirectCallRoute = (
  conversationId: ConversationId,
  callId: string
) => `/chat/${conversationId}/call/${callId}`;

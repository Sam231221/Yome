import type { ConversationId } from "@/types/chat";

export const buildDirectCallRoute = (
  conversationId: ConversationId,
  callId: string
) => `/chat/${conversationId}/call/${callId}`;

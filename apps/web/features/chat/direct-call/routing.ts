import type { ConversationId } from "@/features/chat/types";

export const buildDirectCallRoute = (
  conversationId: ConversationId,
  callId: string
) => `/chat/${conversationId}/call/${callId}`;

import axios from "axios";
import {
  CALL_PARTICIPANTS_ROUTE,
  CALL_TOKEN_ROUTE,
  PREPARE_DIRECT_CALL_CONVERSATION_ROUTE,
} from "@/utils/ApiRoutes";
import type { ConversationId, UserId } from "@/types/chat";

type DirectConversationRecord = {
  id: ConversationId;
};

const getDirectCallServiceError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return null;
  const serverMessage =
    typeof error.response?.data?.error === "string" ? error.response.data.error : null;
  switch (error.response?.status) {
    case 403:
      return (
        serverMessage ??
        "You can only call people you follow, who follow you, or who you've already messaged."
      );
    case 404:
      return "This direct conversation is no longer available.";
    case 503:
      return "Calls aren't available right now. Please try again later.";
    default:
      return error.response ? null : "You appear to be offline. Check your connection.";
  }
};

/** Passed directly to `StreamVideoClient.getOrCreateInstance({ tokenProvider })` — the SDK
 * calls this whenever it needs a fresh token. Replaces `tokenProvider()` in the deleted
 * `apps/web/actions/stream.actions.ts` (B09): same Stream token, minted by
 * `services/messaging` now instead of a Next.js server action, reached through the gateway
 * like every other request instead of a forged internal-token call to the chat service. */
export const tokenProvider = async (): Promise<string> => {
  try {
    const { data } = await axios.post(CALL_TOKEN_ROUTE);
    if (!data?.token) throw new Error("Unable to obtain a call token.");
    return data.token as string;
  } catch (error) {
    throw new Error(
      getDirectCallServiceError(error) ?? "Unable to obtain a call token."
    );
  }
};

export const prepareDirectCallConversation = async ({
  callerId,
  peerId,
}: {
  callerId: UserId;
  peerId: UserId;
}): Promise<DirectConversationRecord> => {
  try {
    const { data } = await axios.post(PREPARE_DIRECT_CALL_CONVERSATION_ROUTE, {
      callerId,
      peerId,
    });
    if (!data?.conversation?.id) {
      throw new Error("Unable to prepare a direct conversation for this call.");
    }
    return data.conversation as DirectConversationRecord;
  } catch (error) {
    throw new Error(
      getDirectCallServiceError(error) ??
        "Unable to prepare a direct conversation for this call."
    );
  }
};

export const ensureDirectCallUsers = async ({
  callerId,
  peerId,
  conversationId,
}: {
  callerId: UserId;
  peerId: UserId;
  conversationId: ConversationId;
}): Promise<void> => {
  try {
    await axios.post(CALL_PARTICIPANTS_ROUTE, {
      callerId,
      peerId,
      conversationId,
    });
  } catch (error) {
    throw new Error(
      getDirectCallServiceError(error) ??
        "Unable to prepare a direct conversation for this call."
    );
  }
};

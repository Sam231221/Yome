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

type StreamSeedUser = {
  id: UserId;
  name?: string | null;
  image?: string | null;
};

const getDirectCallServiceError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return null;
  if (error.response?.status === 403) {
    return "Calls are only available for connected contacts.";
  }
  if (error.response?.status === 404) {
    return "This direct conversation is no longer available.";
  }
  return null;
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
  users,
}: {
  callerId: UserId;
  peerId: UserId;
  conversationId: ConversationId;
  users: StreamSeedUser[];
}): Promise<void> => {
  try {
    await axios.post(CALL_PARTICIPANTS_ROUTE, {
      callerId,
      peerId,
      conversationId,
      users,
    });
  } catch (error) {
    throw new Error(
      getDirectCallServiceError(error) ??
        "Unable to prepare a direct conversation for this call."
    );
  }
};

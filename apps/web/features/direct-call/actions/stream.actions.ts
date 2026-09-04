"use server";

import { getServerSession } from "next-auth/next";
import { StreamClient } from "@stream-io/node-sdk";
import { options } from "@/features/auth/lib/nextauth-options";
import axios from "axios";
import { GET_USER_ROUTE } from "@/utils/ApiRoutes";
import type { ConversationId } from "@/types/chat-contracts";

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY;
const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || "http://127.0.0.1:4103";
const GATEWAY_SHARED_TOKEN = process.env.GATEWAY_SHARED_TOKEN;

type SessionUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

type StreamSeedUser = {
  id: number | string;
  name?: string | null;
  image?: string | null;
};

type EnsureDirectCallUsersParams = {
  callerId: number | string;
  peerId: number | string;
  conversationId: string;
  users: StreamSeedUser[];
};

type DirectConversationRecord = {
  id: ConversationId;
};

const getStreamServerClient = () => {
  if (!STREAM_API_KEY) throw new Error("Stream API key secret is missing");
  if (!STREAM_API_SECRET) throw new Error("Stream API secret is missing");
  return new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
};

const resolveSessionUserId = async (user?: SessionUser) => {
  if (user?.id) return String(user.id);
  if (!user?.email) return null;

  try {
    const { data } = await axios.post(GET_USER_ROUTE, {
      email: user.email,
    });
    const resolvedId = data?.user?.id;
    return resolvedId ? String(resolvedId) : null;
  } catch {
    throw new Error("Failed to fetch user information");
  }
};

const parsePositiveUserId = (value: number | string) => {
  const id = Number.parseInt(String(value), 10);
  if (Number.isNaN(id) || id <= 0) {
    throw new Error("Invalid direct call participant.");
  }
  return id;
};

const getInternalChatHeaders = (userId: number | string) => {
  if (!GATEWAY_SHARED_TOKEN) {
    throw new Error("Gateway shared token is missing");
  }

  return {
    "x-internal-token": GATEWAY_SHARED_TOKEN,
    "x-user-id": String(userId),
  };
};

const getDirectCallServiceError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return null;
  if (error.response?.status === 403) {
    return "Calls are only available for connected contacts.";
  }
  if (error.response?.status === 404) {
    return "This direct conversation is no longer available.";
  }
  return "Unable to prepare a direct conversation for this call.";
};

const validateDirectCallConversation = async ({
  callerId,
  peerId,
  conversationId,
}: {
  callerId: number;
  peerId: number;
  conversationId: string;
}) => {
  try {
    await axios.post(
      `${CHAT_SERVICE_URL}/api/chat/validate-direct-conversation`,
      {
        callerId,
        peerId,
        conversationId,
      },
      {
        headers: getInternalChatHeaders(callerId),
      }
    );
  } catch (error) {
    throw new Error(
      getDirectCallServiceError(error) ??
        "Unable to validate this direct conversation for a call."
    );
  }
};

export const prepareDirectCallConversation = async ({
  callerId,
  peerId,
}: {
  callerId: number | string;
  peerId: number | string;
}): Promise<DirectConversationRecord> => {
  const session = await getServerSession(options);
  const sessionUser = session?.user as SessionUser | undefined;
  if (!sessionUser) throw new Error("User is not authenticated");

  const sessionUserId = await resolveSessionUserId(sessionUser);
  if (!sessionUserId) throw new Error("User ID is missing");
  if (String(callerId) !== sessionUserId) {
    throw new Error("Unauthorized direct call preparation request.");
  }

  const callerUserId = parsePositiveUserId(callerId);
  const peerUserId = parsePositiveUserId(peerId);
  const { data } = await axios
    .post(
      `${CHAT_SERVICE_URL}/api/chat/prepare-direct-call-conversation`,
      {
        callerId: callerUserId,
        peerId: peerUserId,
      },
      {
        headers: getInternalChatHeaders(callerUserId),
      }
    )
    .catch((error) => {
      throw new Error(
        getDirectCallServiceError(error) ??
          "Unable to prepare a direct conversation for this call."
      );
    });

  if (!data?.conversation?.id) {
    throw new Error("Unable to prepare a direct conversation for this call.");
  }

  return data.conversation as DirectConversationRecord;
};

export const tokenProvider = async () => {
  const session = await getServerSession(options);
  const user = session?.user as SessionUser | undefined;
  if (!user) throw new Error("User is not authenticated");

  const userId = await resolveSessionUserId(user);

  if (!userId) throw new Error("User ID is missing");

  const streamClient = getStreamServerClient();

  const expirationTime = Math.floor(Date.now() / 1000) + 3600;
  const issuedAt = Math.floor(Date.now() / 1000) - 60;

  const token = streamClient.generateUserToken({
    user_id: String(userId), // Convert to string to match StreamVideoClient user.id
    validity_in_seconds: 3600,
    exp: expirationTime,
    iat: issuedAt,
  });

  return token;
};

export const ensureDirectCallUsers = async ({
  callerId,
  peerId,
  conversationId,
  users,
}: EnsureDirectCallUsersParams) => {
  const session = await getServerSession(options);
  const sessionUser = session?.user as SessionUser | undefined;
  if (!sessionUser) throw new Error("User is not authenticated");

  const sessionUserId = await resolveSessionUserId(sessionUser);
  if (!sessionUserId) throw new Error("User ID is missing");
  if (String(callerId) !== sessionUserId) {
    throw new Error("Unauthorized direct call provisioning request.");
  }

  const callerUserId = parsePositiveUserId(callerId);
  const peerUserId = parsePositiveUserId(peerId);
  await validateDirectCallConversation({
    callerId: callerUserId,
    peerId: peerUserId,
    conversationId,
  });

  const uniqueUsers = Array.from(
    new Map(
      users
        .filter((user) => String(user.id).trim().length > 0)
        .map((user) => [String(user.id), user])
    ).values()
  );

  const expectedUserIds = new Set([String(callerUserId), String(peerUserId)]);
  const includesOnlyCallMembers = uniqueUsers.every((user) =>
    expectedUserIds.has(String(user.id))
  );
  const includesAllCallMembers = Array.from(expectedUserIds).every((userId) =>
    uniqueUsers.some((user) => String(user.id) === userId)
  );
  if (!includesOnlyCallMembers || !includesAllCallMembers) {
    throw new Error("Unauthorized direct call provisioning request.");
  }

  const streamClient = getStreamServerClient();
  await streamClient.upsertUsers(
    uniqueUsers.map((user) => ({
      id: String(user.id),
      name: user.name?.trim() || `User ${user.id}`,
      image: user.image?.trim() || undefined,
      role: "user",
    }))
  );
};

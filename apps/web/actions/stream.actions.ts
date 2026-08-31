"use server";

import { getServerSession } from "next-auth/next";
import { StreamClient } from "@stream-io/node-sdk";
import getPrismaInstance from "@repo/database";
import { options } from "@/app/api/auth/[...nextauth]/options";
import axios from "axios";
import { GET_USER_ROUTE } from "@/utils/ApiRoutes";

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY;

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

const normalizeDirectConversationParticipants = (
  leftUserId: number,
  rightUserId: number
) =>
  leftUserId < rightUserId
    ? { participantAId: leftUserId, participantBId: rightUserId }
    : { participantAId: rightUserId, participantBId: leftUserId };

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
  const pair = normalizeDirectConversationParticipants(callerUserId, peerUserId);
  const prisma = getPrismaInstance();
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participantAId: pair.participantAId,
      participantBId: pair.participantBId,
    },
  });
  if (!conversation) {
    throw new Error("Direct call conversation is not available.");
  }

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

"use server";

import { getServerSession } from "next-auth/next";
import { StreamClient } from "@stream-io/node-sdk";
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

export const ensureDirectCallUsers = async (users: StreamSeedUser[]) => {
  const session = await getServerSession(options);
  const sessionUser = session?.user as SessionUser | undefined;
  if (!sessionUser) throw new Error("User is not authenticated");

  const sessionUserId = await resolveSessionUserId(sessionUser);
  if (!sessionUserId) throw new Error("User ID is missing");

  const uniqueUsers = Array.from(
    new Map(
      users
        .filter((user) => String(user.id).trim().length > 0)
        .map((user) => [String(user.id), user])
    ).values()
  );

  const sessionUserIncluded = uniqueUsers.some(
    (user) => String(user.id) === sessionUserId
  );

  if (!sessionUserIncluded) {
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

"use server";

import { getServerSession } from "next-auth/next";
import { StreamClient } from "@stream-io/node-sdk";
import { options } from "@/app/api/auth/[...nextauth]/options";

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY;

export const tokenProvider = async () => {
  const session = await getServerSession(options);
  const user = session?.user;
  if (!user) throw new Error("User is not authenticated");
  if (!STREAM_API_KEY) throw new Error("Stream API key secret is missing");
  if (!STREAM_API_SECRET) throw new Error("Stream API secret is missing");

  const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);

  const expirationTime = Math.floor(Date.now() / 1000) + 3600;
  const issuedAt = Math.floor(Date.now() / 1000) - 60;

  const token = streamClient.generateUserToken({
    user_id: user.id,
    validity_in_seconds: 3600,
    exp: expirationTime,
    iat: issuedAt,
  });

  return token;
};

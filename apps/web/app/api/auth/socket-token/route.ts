import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { readSessionToken } from "@/lib/auth/sessionToken";

/**
 * Returns a short-lived JWT for Socket.IO handshake auth.
 * Chat service verifies this with NEXTAUTH_SECRET.
 */
export async function GET(req: NextRequest) {
  const sessionToken = await readSessionToken(req);
  const user = sessionToken as {
    id?: string | number;
    sub?: string;
    email?: string;
  } | null;
  const userId = user?.id ?? user?.sub;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  const token = jwt.sign(
    { sub: String(userId), email: user?.email },
    secret,
    { expiresIn: "5m" },
  );
  return NextResponse.json({ token });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import jwt from "jsonwebtoken";
import { options } from "@/app/api/auth/[...nextauth]/options";

/**
 * Returns a short-lived JWT for Socket.IO handshake auth.
 * Chat service verifies this with NEXTAUTH_SECRET.
 */
export async function GET() {
  const session = await getServerSession(options);
  const user = session?.user as { id?: string; email?: string } | undefined;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  const token = jwt.sign(
    { sub: user.id, email: user.email },
    secret,
    { expiresIn: "5m" },
  );
  return NextResponse.json({ token });
}

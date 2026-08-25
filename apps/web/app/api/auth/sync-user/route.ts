import { NextRequest, NextResponse } from "next/server";
import { decode } from "next-auth/jwt";
import axios from "axios";
import { UPSERT_OAUTH_USER_ROUTE } from "@/utils/ApiRoutes";

const sessionCookieNames = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

function readRawCookie(cookieHeader: string, name: string): string {
  const chunks: Array<{ index: number; value: string }> = [];
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...valueParts] = part.trim().split("=");
    if (!rawKey || valueParts.length === 0) continue;
    const value = decodeURIComponent(valueParts.join("="));
    if (rawKey === name) return value;
    if (rawKey.startsWith(`${name}.`)) {
      const index = Number.parseInt(rawKey.slice(name.length + 1), 10);
      if (!Number.isNaN(index)) chunks.push({ index, value });
    }
  }
  chunks.sort((a, b) => a.index - b.index);
  return chunks.map((chunk) => chunk.value).join("");
}

async function readSessionToken(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  const rawCookieHeader = req.headers.get("cookie") ?? "";

  for (const cookieName of sessionCookieNames) {
    const value = req.cookies.get(cookieName)?.value || readRawCookie(rawCookieHeader, cookieName);
    if (!value) continue;
    for (const salt of ["", cookieName]) {
      try {
        const token = await decode({ token: value, secret, salt });
        if (token) return token;
      } catch {
        // Try the next supported cookie salt format.
      }
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const token = await readSessionToken(req);
    const body = (await req.json().catch(() => ({}))) as {
      email?: string;
      name?: string;
      image?: string;
    };
    const isDev = process.env.NODE_ENV !== "production";
    const email = token?.email ?? (isDev ? body.email : undefined);
    const name = token?.name ?? (isDev ? body.name : undefined);
    const image = token?.picture ?? (isDev ? body.image : undefined);

    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const response = await axios.post(
      UPSERT_OAUTH_USER_ROUTE,
      {
        email,
        name,
        image,
      },
      {
        headers: process.env.GATEWAY_SHARED_TOKEN
          ? { Authorization: `Bearer ${process.env.GATEWAY_SHARED_TOKEN}` }
          : undefined,
        validateStatus: () => true,
      }
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to sync user",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

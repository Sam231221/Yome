import type { NextRequest } from "next/server";
import { decode, type JWT } from "next-auth/jwt";

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

export async function readSessionToken(req: NextRequest): Promise<JWT | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const rawCookieHeader = req.headers.get("cookie") ?? "";

  for (const cookieName of sessionCookieNames) {
    const value =
      req.cookies.get(cookieName)?.value ||
      readRawCookie(rawCookieHeader, cookieName);
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

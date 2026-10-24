import type { Request, Response, NextFunction } from "express";
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";
import type { GatewayRequest } from "../types.js";

const publicRoutePrefixes = [
  "/health",
  "/api/auth/register-user",
  "/api/auth/verify-credentials",
];

const isPublicRoute = (path: string) =>
  publicRoutePrefixes.some((prefix) => path.startsWith(prefix));

const sessionCookieNames = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

function readCookie(cookieHeader: string, name: string): string {
  const parts = cookieHeader.split(";");
  const chunked: Array<{ index: number; value: string }> = [];
  for (const part of parts) {
    const [rawKey, ...valueParts] = part.trim().split("=");
    const key = rawKey ?? "";
    if (valueParts.length === 0) continue;
    const value = decodeURIComponent(valueParts.join("="));
    if (key === name) {
      return value;
    }
    if (key.startsWith(`${name}.`)) {
      const suffix = key.slice(name.length + 1);
      const index = Number.parseInt(suffix, 10);
      if (!Number.isNaN(index)) {
        chunked.push({ index, value });
      }
    }
  }
  if (chunked.length > 0) {
    chunked.sort((a, b) => a.index - b.index);
    return chunked.map((entry) => entry.value).join("");
  }
  return "";
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...valueParts] = part.trim().split("=");
    if (!rawKey || valueParts.length === 0) continue;
    cookies[rawKey] = decodeURIComponent(valueParts.join("="));
  }
  return cookies;
}

function getAuthToken(req: Request): string {
  const authHeader = (req.headers.authorization as string) || "";
  if (authHeader.startsWith("Bearer ")) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }
  const cookieHeader =
    typeof req.headers.cookie === "string" ? req.headers.cookie : "";
  if (!cookieHeader) return "";
  for (const cookieName of sessionCookieNames) {
    const token = readCookie(cookieHeader, cookieName);
    if (token) return token;
  }
  return "";
}

/**
 * Verifies the short-lived token apps/web mints at /api/auth/socket-token (HS256, signed
 * with NEXTAUTH_SECRET, 5-minute expiry). The browser sends it as a bearer token because
 * the NextAuth session cookie belongs to the web app's origin and is never sent to a
 * gateway on another site (e.g. *.vercel.app -> *.up.railway.app).
 */
function verifyWebAccessToken(
  token: string,
  secret: string
): { id: string; email?: string } | null {
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (typeof decoded !== "object" || decoded === null) return null;
    const id = decoded.sub ?? (decoded as { id?: unknown }).id;
    if (id === undefined || id === null || id === "") return null;
    const email = (decoded as { email?: unknown }).email;
    return { id: String(id), email: typeof email === "string" ? email : undefined };
  } catch {
    return null;
  }
}

/**
 * Decodes the caller's identity, when `GATEWAY_REQUIRE_AUTH=true`: the shared
 * service-to-service token (bypasses session decoding entirely), the web app's short-lived
 * access token (see verifyWebAccessToken; used by browsers in deployed, cross-site setups),
 * or a NextAuth session cookie (same-site setups such as localhost). On success for a user
 * token, sets `req.gatewayUser`, which `middleware/proxy.ts` forwards downstream as
 * `x-user-id`/`x-user-email`.
 */
export function createAuthMiddleware(options: {
  authEnabled: boolean;
  sharedGatewayToken: string;
  nextAuthSecret: string;
}) {
  const { authEnabled, sharedGatewayToken, nextAuthSecret } = options;

  return async function auth(req: Request, res: Response, next: NextFunction) {
    const r = req as GatewayRequest;
    if (!authEnabled || isPublicRoute(req.path)) {
      return next();
    }
    const token = getAuthToken(req);
    if (!token) {
      return res.status(401).json({
        ok: false,
        error: "unauthorized",
        details: "Missing auth token",
        requestId: r.requestId,
      });
    }

    if (token === sharedGatewayToken) {
      return next();
    }

    if (nextAuthSecret) {
      const webUser = verifyWebAccessToken(token, nextAuthSecret);
      if (webUser) {
        r.gatewayUser = webUser;
        return next();
      }
      try {
        const decoded = await getToken({
          req: {
            headers: req.headers,
            cookies: parseCookies(
              typeof req.headers.cookie === "string" ? req.headers.cookie : ""
            ),
          } as Parameters<typeof getToken>[0]["req"],
          secret: nextAuthSecret,
        });
        const id = decoded ? decoded.id ?? decoded.sub : undefined;
        if (decoded && id) {
          r.gatewayUser = {
            id: String(id),
            email: typeof decoded.email === "string" ? decoded.email : undefined,
          };
          return next();
        }
      } catch {
        // Fall through to the standard unauthorized response below.
      }
    }

    return res.status(401).json({
      ok: false,
      error: "unauthorized",
      details: "Invalid token",
      requestId: r.requestId,
    });
  };
}

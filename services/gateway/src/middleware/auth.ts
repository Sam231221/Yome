import type { Request, Response, NextFunction } from "express";
import { getToken } from "next-auth/jwt";
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
 * Decodes the caller's identity, when `GATEWAY_REQUIRE_AUTH=true`: either the shared
 * service-to-service token (bypasses session decoding entirely) or a NextAuth session
 * cookie, which is how `apps/web`'s own session format is decoded rather than assuming a
 * plain jsonwebtoken. On success for a session cookie, sets `req.gatewayUser`, which
 * `middleware/proxy.ts` forwards downstream as `x-user-id`/`x-user-email`.
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

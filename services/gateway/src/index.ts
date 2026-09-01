import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { getToken } from "next-auth/jwt";
import crypto from "node:crypto";
import http from "node:http";
import https from "node:https";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import { createLogger, servicePorts } from "@repo/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../../.env") });
dotenv.config();

const nextAuthSecret = process.env.NEXTAUTH_SECRET || "";

interface GatewayRequest extends Request {
  requestId: string;
  rawBody?: Buffer;
  gatewayUser?: { id: string; email?: string };
}

const app = express();
const port = servicePorts.gateway;
const authEnabled = process.env.GATEWAY_REQUIRE_AUTH === "true";
const sharedGatewayToken = process.env.GATEWAY_SHARED_TOKEN || "";
const frontendOrigin =
  process.env.FRONTEND_URL ||
  process.env.FRONTEND_CLIENT_PORT ||
  "http://localhost:3000";
const rateWindowMs = Number(process.env.GATEWAY_RATE_WINDOW_MS || 60_000);
const rateMaxRequests = Number(process.env.GATEWAY_RATE_MAX_REQUESTS || 120);

if (!sharedGatewayToken) {
  throw new Error("GATEWAY_SHARED_TOKEN is required for gateway startup");
}
if (authEnabled && !nextAuthSecret) {
  throw new Error(
    "NEXTAUTH_SECRET is required when GATEWAY_REQUIRE_AUTH is true"
  );
}

const services = {
  auth: process.env.AUTH_SERVICE_URL || "http://127.0.0.1:4101",
  user: process.env.USER_SERVICE_URL || "http://127.0.0.1:4102",
  chat: process.env.CHAT_SERVICE_URL || "http://127.0.0.1:4103",
  media: process.env.MEDIA_SERVICE_URL || "http://127.0.0.1:4104",
  notifications:
    process.env.NOTIFICATIONS_SERVICE_URL || "http://127.0.0.1:4105",
  resources: process.env.RESOURCES_SERVICE_URL || "http://127.0.0.1:4106",
};
const logger = createLogger("gateway");

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "20mb",
    verify: (req: GatewayRequest, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.set("trust proxy", true);

app.use((req: Request, res, next) => {
  const r = req as GatewayRequest;
  r.requestId =
    (req.headers["x-request-id"] as string) || crypto.randomUUID();
  res.setHeader("x-request-id", r.requestId);
  next();
});

const requestBuckets = new Map<
  string,
  { count: number; start: number }
>();
const bucketKey = (req: GatewayRequest) =>
  `${(req as Request & { ip?: string }).ip || "unknown"}:${req.path}`;

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestBuckets.entries()) {
    if (now - value.start > rateWindowMs) {
      requestBuckets.delete(key);
    }
  }
}, rateWindowMs).unref();

app.use((req: Request, res, next) => {
  const r = req as GatewayRequest;
  const key = bucketKey(r);
  const now = Date.now();
  const existing = requestBuckets.get(key);
  if (!existing || now - existing.start > rateWindowMs) {
    requestBuckets.set(key, { count: 1, start: now });
    return next();
  }
  if (existing.count >= rateMaxRequests) {
    return res.status(429).json({
      ok: false,
      error: "rate_limited",
      requestId: r.requestId,
      details: `Too many requests. Limit ${rateMaxRequests}/${rateWindowMs}ms`,
    });
  }
  existing.count += 1;
  requestBuckets.set(key, existing);
  return next();
});

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

app.use(async (req: Request, res, next) => {
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

  // NextAuth owns the browser session cookie format, so use its decoder here
  // instead of assuming the cookie is a plain jsonwebtoken token.
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
});

app.get("/health", (_req, res: Response) =>
  res.status(200).json({ ok: true, service: "gateway", services })
);

const readBody = (req: Request): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });

const hopByHop = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

const gatewayOwnedHeaders = new Set([
  "access-control-allow-origin",
  "access-control-allow-credentials",
  "access-control-allow-headers",
  "access-control-allow-methods",
]);

function copyHeaders(
  inHeaders: Record<string, string | string[] | undefined>,
  setHeader: (k: string, v: string) => void
): void {
  for (const key of Object.keys(inHeaders)) {
    const lower = key.toLowerCase();
    if (hopByHop.has(lower) || gatewayOwnedHeaders.has(lower)) continue;
    const value = inHeaders[key];
    if (value !== undefined && value !== "")
      setHeader(key, Array.isArray(value) ? value.join(", ") : String(value));
  }
}

async function proxyRequest(
  req: GatewayRequest,
  res: Response,
  upstreamBase: string,
  rewritePrefix = "",
  upstreamPathBase = ""
): Promise<void> {
  const incomingPath = req.originalUrl.replace(rewritePrefix, "");
  const target = new URL(
    `${upstreamBase}${upstreamPathBase}${incomingPath}`
  );
  const isHttps = target.protocol === "https:";
  const lib = isHttps ? https : http;

  const forwardHeaders: Record<string, string> = {
    ...(req.headers as Record<string, string>),
    "x-request-id": req.requestId,
    "x-internal-token": sharedGatewayToken,
    host: target.host,
    connection: "close",
  };
  if (req.gatewayUser) {
    forwardHeaders["x-user-id"] = req.gatewayUser.id;
    if (req.gatewayUser.email) forwardHeaders["x-user-email"] = req.gatewayUser.email;
  }
  await new Promise<void>((resolve) => {
    const forwardReq = lib.request(
      target,
      {
        method: req.method,
        headers: forwardHeaders,
      },
      (upstream) => {
        copyHeaders(
          upstream.headers as Record<string, string | string[] | undefined>,
          (k, v) => res.setHeader(k, v)
        );
        res.status(upstream.statusCode ?? 500);
        upstream.pipe(res, { end: true });
        logger.info("Forwarded upstream request", {
          requestId: req.requestId,
          method: req.method,
          path: req.originalUrl,
          status: upstream.statusCode,
          upstream: upstreamBase,
        });
        resolve();
      }
    );

    forwardReq.on("error", (error: Error & { cause?: { message?: string } }) => {
      const details = error.cause
        ? `${error.message} (${(error.cause as Error).message ?? error.cause})`
        : error.message;
      logger.error("Upstream request failed", error, {
        requestId: req.requestId,
        path: req.originalUrl,
        target: target.href,
        error: details,
      });
      if (!res.headersSent) {
        res.status(502).json({
          ok: false,
          error: "upstream_error",
          details,
          requestId: req.requestId,
        });
      }
      resolve();
    });

    if (!["GET", "HEAD"].includes(req.method)) {
      if (req.rawBody) {
        forwardReq.end(req.rawBody);
      } else {
        readBody(req)
          .then((body) => {
            forwardReq.end(body);
          })
          .catch((err) => {
            forwardReq.destroy(err as Error);
          });
      }
    } else {
      forwardReq.end();
    }
  });
}

app.use("/api/auth", (req, res) =>
  proxyRequest(req as GatewayRequest, res, services.auth)
);
app.use("/api/user", (req, res) =>
  proxyRequest(req as GatewayRequest, res, services.user)
);
app.use("/api/db", (req, res) =>
  proxyRequest(req as GatewayRequest, res, services.auth)
);
app.use("/api/media", (req, res) =>
  proxyRequest(req as GatewayRequest, res, services.media)
);
app.use("/api/notifications", (req, res) =>
  proxyRequest(req as GatewayRequest, res, services.notifications)
);
app.use("/api/resources", (req, res) =>
  proxyRequest(req as GatewayRequest, res, services.resources)
);
app.use("/api/chat", (req, res) =>
  proxyRequest(req as GatewayRequest, res, services.chat)
);
app.use("/api/messages", (req, res) =>
  proxyRequest(
    req as GatewayRequest,
    res,
    services.chat,
    "/api/messages",
    "/api/chat"
  )
);

app.listen(port, () => {
  logger.info("Gateway service listening", { port });
});

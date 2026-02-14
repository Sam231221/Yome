import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import crypto from "node:crypto";
import http from "node:http";
import https from "node:https";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import { servicePorts } from "@repo/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../.env") });
dotenv.config();

interface GatewayRequest extends Request {
  requestId: string;
  rawBody?: Buffer;
}

const app = express();
const port = servicePorts.gateway;
const authEnabled = process.env.GATEWAY_REQUIRE_AUTH === "true";
const sharedGatewayToken = process.env.GATEWAY_SHARED_TOKEN || "";
const rateWindowMs = Number(process.env.GATEWAY_RATE_WINDOW_MS || 60_000);
const rateMaxRequests = Number(process.env.GATEWAY_RATE_MAX_REQUESTS || 120);

const services = {
  auth: process.env.AUTH_SERVICE_URL || "http://127.0.0.1:4101",
  chat: process.env.CHAT_SERVICE_URL || "http://127.0.0.1:4103",
  media: process.env.MEDIA_SERVICE_URL || "http://127.0.0.1:4104",
  notifications:
    process.env.NOTIFICATIONS_SERVICE_URL || "http://127.0.0.1:4105",
};

app.use(cors());
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
  "/api/auth/get-user",
  "/api/auth/register-user",
  "/api/auth/generate-token",
];

const isPublicRoute = (path: string) =>
  publicRoutePrefixes.some((prefix) => path.startsWith(prefix));

app.use((req: Request, res, next) => {
  const r = req as GatewayRequest;
  if (!authEnabled || isPublicRoute(req.path)) {
    return next();
  }
  const authHeader = (req.headers.authorization as string) || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token || token !== sharedGatewayToken) {
    return res.status(401).json({
      ok: false,
      error: "unauthorized",
      details: "Missing or invalid gateway bearer token",
      requestId: r.requestId,
    });
  }
  return next();
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

function copyHeaders(
  inHeaders: Record<string, string | string[] | undefined>,
  setHeader: (k: string, v: string) => void
): void {
  for (const key of Object.keys(inHeaders)) {
    const lower = key.toLowerCase();
    if (hopByHop.has(lower)) continue;
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

  await new Promise<void>((resolve) => {
    const forwardReq = lib.request(
      target,
      {
        method: req.method,
        headers: {
          ...req.headers,
          "x-request-id": req.requestId,
          host: target.host,
          connection: "close",
        },
      },
      (upstream) => {
        copyHeaders(
          upstream.headers as Record<string, string | string[] | undefined>,
          (k, v) => res.setHeader(k, v)
        );
        res.status(upstream.statusCode ?? 500);
        upstream.pipe(res, { end: true });
        console.log(
          JSON.stringify({
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            status: upstream.statusCode,
            upstream: upstreamBase,
          })
        );
        resolve();
      }
    );

    forwardReq.on("error", (error: Error & { cause?: { message?: string } }) => {
      const details = error.cause
        ? `${error.message} (${(error.cause as Error).message ?? error.cause})`
        : error.message;
      console.error("[gateway] upstream request failed", {
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
app.use("/api/db", (req, res) =>
  proxyRequest(req as GatewayRequest, res, services.auth)
);
app.use("/api/ei", (req, res) =>
  proxyRequest(req as GatewayRequest, res, services.auth)
);
app.use("/api/media", (req, res) =>
  proxyRequest(req as GatewayRequest, res, services.media)
);
app.use("/api/notifications", (req, res) =>
  proxyRequest(req as GatewayRequest, res, services.notifications)
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
  console.log(`Gateway service listening on ${port}`);
});

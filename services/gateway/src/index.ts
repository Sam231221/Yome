import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import { createLogger, servicePorts } from "@repo/service-kit";
import { routeManifest, type Upstream } from "./routes/route-manifest.js";
import { requestId } from "./middleware/requestId.js";
import { createRateLimiter } from "./middleware/rateLimiter.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { proxyRequest } from "./middleware/proxy.js";
import type { GatewayRequest } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../../.env") });
dotenv.config();

const nextAuthSecret = process.env.NEXTAUTH_SECRET || "";

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

const serviceBaseUrls: Record<Upstream, string> = {
  // Renamed from `auth` in B05; reads IDENTITY_SERVICE_URL (was AUTH_SERVICE_URL).
  identity: process.env.IDENTITY_SERVICE_URL || "http://127.0.0.1:4101",
  // Renamed from `chat` in B09. Reads MESSAGING_SERVICE_URL (was CHAT_SERVICE_URL).
  messaging: process.env.MESSAGING_SERVICE_URL || "http://127.0.0.1:4103",
  media: process.env.MEDIA_SERVICE_URL || "http://127.0.0.1:4104",
  notifications:
    process.env.NOTIFICATIONS_SERVICE_URL || "http://127.0.0.1:4105",
  // The consolidated service B06 introduced (community, then learning + resources in B07,
  // then dashboard in B08 — services/user no longer exists).
  core: process.env.CORE_SERVICE_URL || "http://127.0.0.1:4107",
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
    verify: (req: express.Request, _res, buf) => {
      (req as GatewayRequest).rawBody = buf;
    },
  })
);
app.set("trust proxy", true);

// Order matters: requestId first (so even a rejected request carries one), then rate
// limiting, then auth. See middleware/*.ts for each concern; routing/resilience lives in
// routes/route-manifest.ts + middleware/proxy.ts.
app.use(requestId);
app.use(createRateLimiter({ windowMs: rateWindowMs, maxRequests: rateMaxRequests }));
app.use(createAuthMiddleware({ authEnabled, sharedGatewayToken, nextAuthSecret }));

app.get("/health", (_req, res) =>
  res.status(200).json({ ok: true, service: "gateway", services: serviceBaseUrls })
);

for (const rule of routeManifest) {
  app.use(rule.prefix, (req, res) =>
    proxyRequest(req as GatewayRequest, res, rule, serviceBaseUrls[rule.upstream], sharedGatewayToken)
  );
}

// "::" binds dual-stack, so the service is reachable over Railway's IPv6 private network as
// well as on IPv4 (localhost in dev).
app.listen(port, "::", () => {
  logger.info("Gateway service listening", { port });
});

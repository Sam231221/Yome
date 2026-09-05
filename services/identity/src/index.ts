import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import {
  createLogger,
  servicePorts,
  errorHandler,
  internalTokenGuard,
} from "@repo/service-kit";

import credentialsRoutes from "./modules/credentials/credentials.routes.js";
import profileRoutes from "./modules/profile/profile.routes.js";
import seedRoutes from "./dev/seed-route.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../../.env") });
dotenv.config();

const app = express();
const port = servicePorts.identity;
const logger = createLogger("identity");

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) =>
  res.status(200).json({ ok: true, service: "identity" }),
);
app.use(internalTokenGuard);

app.use("/api/auth", credentialsRoutes);
// Only get-user-by-id, update-user, and get-all-users are defined on this router.
// Everything else under /api/user is served by services/core (see the gateway's
// routeRules.ts for the split).
app.use("/api/user", profileRoutes);
app.use("/api/db", seedRoutes);

app.use(errorHandler);

app.listen(port, () => {
  logger.info("Identity service listening", { port });
});

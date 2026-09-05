import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import { createLogger, errorHandler, internalTokenGuard, servicePorts } from "@repo/shared";

import communityRoutes from "./modules/community/community.routes.js";
import learningRoutes from "./modules/learning/learning.routes.js";
import resourcesRoutes from "./modules/learning/resources/resources.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../../.env") });
dotenv.config();

const logger = createLogger("core");

const app = express();
const port = servicePorts.core;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) =>
  res.status(200).json({ ok: true, service: "core" })
);
app.use(internalTokenGuard);

// community (B06), learning (B07), and dashboard (B08) all mount at /api/user; each
// owns a disjoint set of paths (see routeRules.ts on the gateway side for the external
// view — external paths were already 1:1 with core before this batch's dashboard mount).
app.use("/api/user", communityRoutes);
app.use("/api/user", learningRoutes);
app.use("/api/user", dashboardRoutes);
app.use("/api/resources", resourcesRoutes);

app.use(errorHandler);

app.listen(port, () => {
  logger.info("Core service listening", { port });
});

import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import { createLogger, errorHandler, internalTokenGuard, servicePorts } from "@repo/shared";

import communityRoutes from "./modules/community/community.routes.js";
import learningRoutes from "./modules/learning/learning.routes.js";
import resourcesRoutes from "./modules/learning/resources/resources.routes.js";

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

// community is the first module core absorbed (B06); learning followed in B07.
// feed/dashboard (B08) mounts alongside them here once it lands.
app.use("/api/user", communityRoutes);
app.use("/api/user", learningRoutes);
app.use("/api/resources", resourcesRoutes);

app.use(errorHandler);

app.listen(port, () => {
  logger.info("Core service listening", { port });
});

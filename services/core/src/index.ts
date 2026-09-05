import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import { createLogger, errorHandler, internalTokenGuard, servicePorts } from "@repo/shared";

import communityRoutes from "./modules/community/community.routes.js";

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

// community is the first module core absorbs (B06); learning (B07) and
// feed/dashboard (B08) mount alongside it here as they land.
app.use("/api/user", communityRoutes);

app.use(errorHandler);

app.listen(port, () => {
  logger.info("Core service listening", { port });
});

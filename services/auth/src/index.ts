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
} from "@repo/shared";

import authRoutes from "./routes/auth.routes.js";
import dbRoutes from "./routes/db.routes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../../.env") });
dotenv.config();

const app = express();
const port = servicePorts.auth;
const logger = createLogger("auth");

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) =>
  res.status(200).json({ ok: true, service: "auth" })
);
app.use(internalTokenGuard);

app.use("/api/auth", authRoutes);
app.use("/api/db", dbRoutes);

app.use(errorHandler);

app.listen(port, () => {
  logger.info("Auth service listening", { port });
});

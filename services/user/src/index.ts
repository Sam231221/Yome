import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import {
  createLogger,
  errorHandler,
  internalTokenGuard,
  servicePorts,
  validateObjectStorageEnv,
} from "@repo/shared";

import userRoutes from "./routes/user.routes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../../.env") });
dotenv.config();

validateObjectStorageEnv();

const logger = createLogger("user");

const app = express();
const port = servicePorts.user;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) =>
  res.status(200).json({ ok: true, service: "user" })
);
app.use(internalTokenGuard);

app.use("/api/user", userRoutes);

app.use(errorHandler);

app.listen(port, () => {
  logger.info("User service listening", {
    port,
    storageProvider: process.env.STORAGE_PROVIDER?.trim() || "s3",
  });
});

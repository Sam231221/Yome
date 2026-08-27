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
import mediaRoutes from "./routes/media.routes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../../.env") });
dotenv.config();

validateObjectStorageEnv();

const logger = createLogger("media");

const app = express();
const port = servicePorts.media;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) =>
  res.status(200).json({ ok: true, service: "media" })
);
app.use(internalTokenGuard);

app.use("/api/media", mediaRoutes);

app.use(errorHandler);

app.listen(port, () => {
  logger.info("Media service listening", {
    port,
    storageProvider: process.env.STORAGE_PROVIDER?.trim() || "s3",
  });
});

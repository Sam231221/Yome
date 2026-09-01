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
} from "@repo/shared";
import resourceRoutes from "./routes/resource.routes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../../.env") });
dotenv.config();

const app = express();
const port = servicePorts.resources;
const logger = createLogger("resources");

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) =>
  res.status(200).json({ ok: true, service: "resources" })
);
app.use(internalTokenGuard);

app.use("/api/resources", resourceRoutes);

app.use(errorHandler);

app.listen(port, () => {
  logger.info("Resources service listening", { port });
});

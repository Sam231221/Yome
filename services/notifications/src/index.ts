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
import notificationRoutes from "./routes/notifications.routes.js";
import { startNotificationConsumer } from "./consumer/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../../.env") });
dotenv.config();

const app = express();
const port = servicePorts.notifications;
const logger = createLogger("notifications");

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) =>
  res.status(200).json({ ok: true, service: "notifications" })
);
app.use(internalTokenGuard);

app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);

const server = app.listen(port, () => {
  logger.info("Notifications service listening", { port });
});

// B14: the notification event consumer runs in-process here — the mirror of the outbox relay
// running in-process inside `services/core` (B13). It reads every producing domain's stream
// (`yome:events:*`) as consumer group `notifications` and turns domain facts into
// notification rows. `services/notifications` is its own deployable precisely so this
// long-running consumer can later move to its own process without touching anything else.
const consumer = startNotificationConsumer();

function shutdown(signal: string) {
  logger.info("Shutting down", { signal });
  void consumer.stop().finally(() => {
    server.close(() => process.exit(0));
  });
  // Force-exit if connections don't drain in time.
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

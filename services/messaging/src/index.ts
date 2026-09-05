import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import {
  createLogger,
  servicePorts,
  errorHandler,
  internalTokenGuard,
} from "@repo/shared";

import messagesRoutes from "./modules/messages/messages.routes.js";
import callsRoutes from "./modules/calls/calls.routes.js";
import { attachSocketHandlers } from "./modules/realtime/handlers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../../.env") });
dotenv.config();

const app = express();
const port = servicePorts.messaging;
const logger = createLogger("messaging");

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) =>
  res.status(200).json({ ok: true, service: "messaging" })
);
app.use(internalTokenGuard);

// Both external prefixes (/api/chat, and /api/messages rewritten to /api/chat by the
// gateway) land here unchanged (B09) — only the module split underneath moved.
app.use("/api/chat", messagesRoutes);
app.use("/api/chat", callsRoutes);

app.use(errorHandler);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.FRONTEND_URL ||
      process.env.FRONTEND_CLIENT_PORT ||
      "http://localhost:3000",
    credentials: true,
  },
});

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (!nextAuthSecret) {
  throw new Error("NEXTAUTH_SECRET is required for messaging socket authentication");
}

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error("unauthorized"));
  try {
    const decoded = jwt.verify(token, nextAuthSecret) as { sub?: string; id?: string };
    const userId = decoded.sub ?? decoded.id;
    if (!userId) return next(new Error("unauthorized"));
    socket.data.userId = userId;
  } catch {
    return next(new Error("unauthorized"));
  }
  next();
});

attachSocketHandlers(io);

httpServer.listen(port, () => {
  logger.info("Messaging service listening", { port });
});

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

import chatRoutes from "./routes/chat.routes.js";
import { attachSocketHandlers } from "./socket/handlers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../../.env") });
dotenv.config();

const app = express();
const port = servicePorts.chat;
const logger = createLogger("chat");

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) =>
  res.status(200).json({ ok: true, service: "chat" })
);
app.use(internalTokenGuard);

app.use("/api/chat", chatRoutes);

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
  throw new Error("NEXTAUTH_SECRET is required for chat socket authentication");
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
  logger.info("Chat service listening", { port });
});

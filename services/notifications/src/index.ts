import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import { servicePorts, errorHandler } from "@repo/shared";
import notificationRoutes from "./routes/notifications.routes.js";

// TODO: Implement actual notification sending (email, push, in-app).

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../.env") });
dotenv.config();

const app = express();
const port = servicePorts.notifications;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) =>
  res.status(200).json({ ok: true, service: "notifications" })
);

app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Notifications service listening on ${port}`);
});

import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import { servicePorts, errorHandler, internalTokenGuard } from "@repo/shared";

import userRoutes from "./routes/user.routes.js";
import { configCloudinary } from "./lib/cloudinary.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../.env") });
dotenv.config();

configCloudinary();

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
  console.log(`User service listening on ${port}`);
});

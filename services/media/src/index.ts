import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import { servicePorts, errorHandler, internalTokenGuard } from "@repo/shared";
import { configCloudinary } from "./lib/cloudinary.js";
import mediaRoutes from "./routes/media.routes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../../.env") });
dotenv.config();

configCloudinary();

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
  console.log(`Media service listening on ${port}`);
});

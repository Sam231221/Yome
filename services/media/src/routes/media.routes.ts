import { Router } from "express";
import multer from "multer";
import {
  ALLOWED_AUDIO_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  createHttpError,
  isAllowedMimeType,
} from "@repo/shared";
import { uploadAudio, uploadImage } from "../controllers/media.controller.js";

const storage = multer.memoryStorage();

const audioUpload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedMimeType(ALLOWED_AUDIO_MIME_TYPES, file.mimetype)) {
      callback(createHttpError("Unsupported audio type.", 400));
      return;
    }
    callback(null, true);
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedMimeType(ALLOWED_IMAGE_MIME_TYPES, file.mimetype)) {
      callback(createHttpError("Unsupported image type.", 400));
      return;
    }
    callback(null, true);
  },
});

const router = Router();

router.post("/add-audio-message", audioUpload.single("audio"), uploadAudio);
router.post("/add-image-message", imageUpload.single("image"), uploadImage);

export default router;

import type { Request, Response, NextFunction } from "express";
import {
  ALLOWED_AUDIO_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  assertAllowedMimeType,
  createLogger,
  uploadBufferToS3,
} from "@repo/shared";

const logger = createLogger("media");

const getChatUploadScope = (req: Request) => {
  const chatType = String(req.body?.chatType ?? "").trim();
  const target = String(req.body?.to ?? "").trim();
  const conversationId = String(req.body?.conversationId ?? "").trim();

  if (!chatType) return undefined;

  if (chatType === "group") {
    return target ? { chatType: "group" as const, groupId: target } : undefined;
  }

  return conversationId
    ? {
        chatType: "direct" as const,
        conversationId,
      }
    : undefined;
};

/**
 * Upload audio to object storage and return the public URL. Message persistence is done by the chat service.
 */
export async function uploadAudio(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file?.buffer) {
      res.status(400).json({ ok: false, error: "Audio is required." });
      return;
    }

    assertAllowedMimeType(ALLOWED_AUDIO_MIME_TYPES, req.file.mimetype, "audio");

    const audio = await uploadBufferToS3({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalFilename: req.file.originalname || "audio-message.webm",
      target: "chat-audio",
      chatScope: getChatUploadScope(req),
    });

    logger.info("Uploaded audio message asset", {
      bucket: audio.bucket,
      contentType: audio.contentType,
      key: audio.key,
      requestId: req.headers["x-request-id"],
      userId: req.headers["x-user-id"],
    });

    res.status(200).json({ ok: true, url: audio.url, type: "audio" });
  } catch (error) {
    logger.error("Failed to upload audio message asset", error, {
      contentType: req.file?.mimetype,
      requestId: req.headers["x-request-id"],
      userId: req.headers["x-user-id"],
    });
    next(error);
  }
}

/**
 * Upload image to object storage and return the public URL. Message persistence is done by the chat service.
 */
export async function uploadImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file?.buffer) {
      res.status(400).json({ ok: false, error: "Image is required." });
      return;
    }

    assertAllowedMimeType(ALLOWED_IMAGE_MIME_TYPES, req.file.mimetype, "image");

    const image = await uploadBufferToS3({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalFilename: req.file.originalname || "image-message",
      target: "chat-image",
      chatScope: getChatUploadScope(req),
    });

    logger.info("Uploaded image message asset", {
      bucket: image.bucket,
      contentType: image.contentType,
      key: image.key,
      requestId: req.headers["x-request-id"],
      userId: req.headers["x-user-id"],
    });

    res.status(200).json({ ok: true, url: image.url, type: "image" });
  } catch (err) {
    logger.error("Failed to upload image message asset", err, {
      contentType: req.file?.mimetype,
      requestId: req.headers["x-request-id"],
      userId: req.headers["x-user-id"],
    });
    next(err);
  }
}

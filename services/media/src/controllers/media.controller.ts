import type { Request, Response, NextFunction } from "express";
import axios from "axios";
import {
  createHttpError,
} from "@repo/contracts";
import {
  createLogger,
} from "@repo/service-kit";
import {
  ALLOWED_AUDIO_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  assertAllowedMimeType,
  uploadBufferToS3,
} from "@repo/storage";

const logger = createLogger("media");

type ChatUploadScope =
  | {
      chatType: "direct";
      conversationId: string;
    }
  | {
      chatType: "group";
      groupId: string;
    };

const getAuthenticatedUserId = (req: Request): number | null => {
  const raw = req.headers["x-user-id"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number.parseInt(String(value ?? ""), 10);
  return Number.isNaN(id) ? null : id;
};

/**
 * Authorises a media upload with `services/messaging` (B09) instead of reading
 * `Conversation`/`Group` directly — `media` holds no database access at all. This is the
 * one permitted media -> messaging service-to-service call (see
 * docs/services_packages_refactoring/api-and-dataflow-plan.md's "Service-to-Service Call
 * Rules"): media already holds `GATEWAY_SHARED_TOKEN` to validate its own inbound
 * `internalTokenGuard`, so relaying it onward here isn't a new secret leaking anywhere new —
 * it's the same shared-token model every backend service in this repo already uses.
 */
const getChatUploadScope = async (req: Request): Promise<ChatUploadScope> => {
  const authenticatedUserId = getAuthenticatedUserId(req);
  if (authenticatedUserId === null) {
    throw createHttpError("Unauthorized.", 401);
  }

  const gatewaySharedToken = process.env.GATEWAY_SHARED_TOKEN;
  if (!gatewaySharedToken) {
    throw createHttpError("Gateway shared token is missing", 500);
  }
  const messagingServiceUrl =
    process.env.MESSAGING_SERVICE_URL || "http://127.0.0.1:4103";

  const { chatType, from, to, conversationId } = req.body as {
    chatType?: string;
    from?: number | string;
    to?: number | string;
    conversationId?: string;
  };

  try {
    const { data } = await axios.post(
      `${messagingServiceUrl}/api/chat/authorize-upload-scope`,
      { chatType, from, to, conversationId },
      {
        headers: {
          "x-internal-token": gatewaySharedToken,
          "x-user-id": String(authenticatedUserId),
        },
      }
    );

    if (data?.chatType === "group") {
      return { chatType: "group", groupId: data.groupId };
    }
    return { chatType: "direct", conversationId: data.conversationId };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw createHttpError(
        error.response.data?.error || "Forbidden.",
        error.response.status
      );
    }
    throw error;
  }
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

    const chatScope = await getChatUploadScope(req);

    const audio = await uploadBufferToS3({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalFilename: req.file.originalname || "audio-message.webm",
      target: "chat-audio",
      chatScope,
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

    const chatScope = await getChatUploadScope(req);

    const image = await uploadBufferToS3({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalFilename: req.file.originalname || "image-message",
      target: "chat-image",
      chatScope,
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

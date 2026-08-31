import type { Request, Response, NextFunction } from "express";
import getPrismaInstance from "@repo/database";
import {
  ALLOWED_AUDIO_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  assertAllowedMimeType,
  createHttpError,
  createLogger,
  uploadBufferToS3,
} from "@repo/shared";

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

const parseRequiredUserId = (value: unknown): number | null => {
  const id = Number.parseInt(String(value ?? ""), 10);
  return Number.isNaN(id) ? null : id;
};

const normalizeDirectConversationParticipants = (
  leftUserId: number,
  rightUserId: number
) =>
  leftUserId < rightUserId
    ? { participantAId: leftUserId, participantBId: rightUserId }
    : { participantAId: rightUserId, participantBId: leftUserId };

const getChatUploadScope = async (
  req: Request
): Promise<ChatUploadScope> => {
  const chatType = String(req.body?.chatType ?? "").trim();
  const target = String(req.body?.to ?? "").trim();
  const fromId = parseRequiredUserId(req.body?.from);
  const authenticatedUserId = getAuthenticatedUserId(req);
  const conversationId = String(req.body?.conversationId ?? "").trim();

  if (authenticatedUserId === null) {
    throw createHttpError("Unauthorized.", 401);
  }
  if (fromId === null || fromId !== authenticatedUserId) {
    throw createHttpError("Forbidden.", 403);
  }

  if (chatType === "group") {
    if (!target) {
      throw createHttpError("Group id is required.", 400);
    }

    const prisma = getPrismaInstance();
    const groupCount = await prisma.group.count({
      where: {
        id: target,
        OR: [
          { members: { some: { id: authenticatedUserId } } },
          { admins: { some: { id: authenticatedUserId } } },
        ],
      },
    });
    if (groupCount === 0) {
      throw createHttpError("Forbidden.", 403);
    }

    return { chatType: "group", groupId: target };
  }

  if (chatType !== "user") {
    throw createHttpError("Invalid chat type.", 400);
  }
  if (!conversationId) {
    throw createHttpError("Conversation id is required.", 400);
  }

  const toId = parseRequiredUserId(target);
  if (toId === null) {
    throw createHttpError("Recipient id is required.", 400);
  }

  const pair = normalizeDirectConversationParticipants(authenticatedUserId, toId);
  const prisma = getPrismaInstance();
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participantAId: pair.participantAId,
      participantBId: pair.participantBId,
    },
  });
  if (!conversation) {
    throw createHttpError("Forbidden.", 403);
  }

  return {
    chatType: "direct",
    conversationId,
  };
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

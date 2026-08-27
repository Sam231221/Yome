import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHttpError } from "../errors.js";

const DEFAULT_CACHE_CONTROL = "public, max-age=31536000, immutable";

const MIME_EXTENSION_MAP = {
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/webm": "webm",
  "audio/x-m4a": "m4a",
  "audio/x-wav": "wav",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/x-m4a",
  "audio/x-wav",
] as const;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedAudioMimeType = (typeof ALLOWED_AUDIO_MIME_TYPES)[number];
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
export type SupportedUploadMimeType =
  | AllowedAudioMimeType
  | AllowedImageMimeType;
export type UploadTarget = "chat-audio" | "chat-image" | "profile-avatar";

type ChatUploadScope =
  | {
      chatType: "direct";
      senderId: number;
      receiverId: number;
    }
  | {
      chatType: "group";
      senderId: number;
      groupId: string;
    };

type S3Config = {
  region: string;
  bucket: string;
  publicBaseUrl: string;
  prefix: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export type S3UploadResult = {
  bucket: string;
  contentType: SupportedUploadMimeType;
  key: string;
  url: string;
};

let cachedS3Client: S3Client | null = null;

const getStorageProvider = () => process.env.STORAGE_PROVIDER?.trim() || "s3";

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");
const normalizeStorageSegment = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

const getPublicMediaBaseUrl = () =>
  process.env.AWS_CLOUDFRONT_URL?.trim() ||
  process.env.AWS_S3_PUBLIC_BASE_URL?.trim() ||
  "";

const getRequiredStorageEnv = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required storage environment variable: ${name}`);
  }
  return value;
};

export function validateObjectStorageEnv(): void {
  const provider = getStorageProvider();
  if (provider !== "s3") {
    throw new Error(
      `Unsupported STORAGE_PROVIDER "${provider}". Only "s3" is supported.`
    );
  }

  getRequiredStorageEnv("AWS_REGION");
  getRequiredStorageEnv("AWS_ACCESS_KEY_ID");
  getRequiredStorageEnv("AWS_SECRET_ACCESS_KEY");
  getRequiredStorageEnv("AWS_S3_BUCKET");

  if (!getPublicMediaBaseUrl()) {
    throw new Error(
      "Missing required storage environment variable: AWS_S3_PUBLIC_BASE_URL or AWS_CLOUDFRONT_URL"
    );
  }
}

const getS3Config = (): S3Config => {
  validateObjectStorageEnv();

  return {
    region: getRequiredStorageEnv("AWS_REGION"),
    bucket: getRequiredStorageEnv("AWS_S3_BUCKET"),
    publicBaseUrl: getPublicMediaBaseUrl(),
    prefix: trimSlashes(process.env.AWS_S3_PREFIX?.trim() || ""),
    accessKeyId: getRequiredStorageEnv("AWS_ACCESS_KEY_ID"),
    secretAccessKey: getRequiredStorageEnv("AWS_SECRET_ACCESS_KEY"),
  };
};

const getS3Client = () => {
  if (cachedS3Client) {
    return cachedS3Client;
  }

  const config = getS3Config();
  cachedS3Client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return cachedS3Client;
};

const buildPublicUrl = (key: string) => {
  const { publicBaseUrl } = getS3Config();
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  const normalizedBaseUrl = publicBaseUrl.endsWith("/")
    ? publicBaseUrl
    : `${publicBaseUrl}/`;

  return new URL(encodedKey, normalizedBaseUrl).toString();
};

export const getRemoteMediaHostPattern = () => {
  const baseUrl = getPublicMediaBaseUrl();
  if (!baseUrl) return null;

  try {
    const parsed = new URL(baseUrl);
    const pathname = parsed.pathname.replace(/\/+$/g, "");

    return {
      protocol: parsed.protocol.replace(":", ""),
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      pathname: pathname ? `${pathname}/**` : "/**",
    };
  } catch {
    return null;
  }
};

const toMimeSet = (mimeTypes: readonly string[]) => new Set(mimeTypes);

export function isAllowedMimeType(
  allowedMimeTypes: readonly string[],
  mimeType?: string
): mimeType is SupportedUploadMimeType {
  if (!mimeType) return false;
  return toMimeSet(allowedMimeTypes).has(mimeType);
}

export function assertAllowedMimeType(
  allowedMimeTypes: readonly string[],
  mimeType?: string,
  label = "file"
): asserts mimeType is SupportedUploadMimeType {
  if (!isAllowedMimeType(allowedMimeTypes, mimeType)) {
    throw createHttpError(`Unsupported ${label} type.`, 400);
  }
}

export function inferExtensionFromMimeType(mimeType: SupportedUploadMimeType) {
  const extension = MIME_EXTENSION_MAP[mimeType];
  if (!extension) {
    throw createHttpError("Unsupported file type.", 400);
  }
  return extension;
}

const buildObjectKey = ({
  target,
  entityId,
  chatScope,
  extension,
  now = new Date(),
}: {
  target: UploadTarget;
  entityId?: string | number;
  chatScope?: ChatUploadScope;
  extension: string;
  now?: Date;
}) => {
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const filename = `${randomUUID()}.${extension}`;

  if (target === "profile-avatar") {
    if (!entityId) {
      throw new Error("profile-avatar uploads require an entityId");
    }
    return `media/users/user-${entityId}/avatars/${year}/${month}/${filename}`;
  }

  if (!chatScope) {
    throw new Error(`${target} uploads require a chat scope`);
  }

  const mediaFolder = target === "chat-audio" ? "audio" : "images";

  if (chatScope.chatType === "group") {
    const groupKey = normalizeStorageSegment(chatScope.groupId);
    if (!groupKey) {
      throw new Error("group chat uploads require a valid groupId");
    }

    return `media/chat/groups/group-${groupKey}/messages/${mediaFolder}/${year}/${month}/${day}/${filename}`;
  }

  const orderedUserIds = [chatScope.senderId, chatScope.receiverId].sort(
    (left, right) => left - right
  );
  const directThreadKey = orderedUserIds
    .map((id) => `user-${id}`)
    .join("__");

  if (target === "chat-audio") {
    return `media/chat/direct/${directThreadKey}/messages/audio/${year}/${month}/${day}/${filename}`;
  }

  return `media/chat/direct/${directThreadKey}/messages/images/${year}/${month}/${day}/${filename}`;
};

const buildScopedKey = (key: string) => {
  const { prefix } = getS3Config();
  return prefix ? `${prefix}/${key}` : key;
};

export async function uploadBufferToS3(params: {
  buffer: Uint8Array;
  mimeType: SupportedUploadMimeType;
  originalFilename?: string;
  target: UploadTarget;
  entityId?: string | number;
  chatScope?: ChatUploadScope;
  cacheControl?: string;
}): Promise<S3UploadResult> {
  const { bucket } = getS3Config();
  const extension = inferExtensionFromMimeType(params.mimeType);
  const key = buildScopedKey(
    buildObjectKey({
      target: params.target,
      entityId: params.entityId,
      chatScope: params.chatScope,
      extension,
    })
  );

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: params.buffer,
      ContentType: params.mimeType,
      CacheControl: params.cacheControl || DEFAULT_CACHE_CONTROL,
      Metadata: params.originalFilename
        ? {
            originalfilename: params.originalFilename.slice(0, 200),
          }
        : undefined,
    })
  );

  return {
    bucket,
    contentType: params.mimeType,
    key,
    url: buildPublicUrl(key),
  };
}

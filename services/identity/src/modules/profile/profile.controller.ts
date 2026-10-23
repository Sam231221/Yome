import type { Request, Response, NextFunction } from "express";
import getPrismaInstance from "@repo/database";
import {
  getAuthenticatedUserId,
} from "@repo/contracts";
import {
  createLogger,
} from "@repo/service-kit";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  assertAllowedMimeType,
  uploadBufferToS3,
} from "@repo/storage";
import { withOutbox } from "@repo/events";

const logger = createLogger("identity-profile");

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.body as { userId?: string };
    if (!userId) {
      res.status(400).json({ ok: false, error: "Id is required" });
      return;
    }
    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        name: true,
        username: true,
        role: true,
        profilePicture: true,
        userProfile: { select: { bio: true, address: true } },
      },
    });
    if (!user) {
      res.status(404).json({ ok: false, error: "User not found" });
    } else {
      res.status(200).json({ ok: true, user });
    }
  } catch (error) {
    next(error);
  }
}

export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
    const userId = parseInt(String(req.query.userId ?? ""), 10);
    if (Number.isNaN(userId)) {
      res.status(400).json({ ok: false, error: "Invalid user id" });
      return;
    }
    if (userId !== authenticatedUserId) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }
    const { email, bio, lastname, firstname, address, username } = req.body as Record<
      string,
      string
    >;
    let imageUrl: string | null = null;

    if (req.file?.buffer) {
      assertAllowedMimeType(ALLOWED_IMAGE_MIME_TYPES, req.file.mimetype, "avatar");
      const upload = await uploadBufferToS3({
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        originalFilename: req.file.originalname || "avatar",
        target: "profile-avatar",
        entityId: userId,
      });
      imageUrl = upload.url;
      logger.info("Uploaded profile avatar", {
        bucket: upload.bucket,
        contentType: upload.contentType,
        key: upload.key,
        requestId: req.headers["x-request-id"],
        userId,
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { userProfile: true },
    });
    if (!existingUser?.userProfile) {
      res.status(404).json({ ok: false, error: "User not found" });
      return;
    }

    if (existingUser.email !== email) {
      const existingWithEmail = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
      });
      if (existingWithEmail) {
        res.status(409).json({ ok: false, error: "Email is already taken." });
        return;
      }
    }

    const normalizedUsername = String(username ?? "").trim();
    if (!normalizedUsername) {
      res.status(400).json({ ok: false, error: "Username is required." });
      return;
    }
    if (existingUser.username !== normalizedUsername) {
      const existingWithUsername = await prisma.user.findFirst({
        where: { username: normalizedUsername, NOT: { id: userId } },
      });
      if (existingWithUsername) {
        res.status(409).json({ ok: false, error: "Username is already taken." });
        return;
      }
    }

    const userUpdateData: Record<string, unknown> = {
      username: normalizedUsername,
      firstname: firstname ?? "",
      lastname: lastname ?? "",
      name: `${firstname ?? ""} ${lastname ?? ""}`.trim(),
      email: email ?? "",
    };
    if (imageUrl) userUpdateData.profilePicture = imageUrl;

    const newBio = bio ?? "";
    const newAddress = address ?? "";

    const { user, userProfile } = await withOutbox(
      prisma,
      async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: userUpdateData as Parameters<typeof prisma.user.update>[0]["data"],
        });
        const updatedProfile = await tx.userProfile.update({
          where: { id: existingUser.userProfile!.id },
          data: { bio: newBio, address: newAddress },
        });
        return { user: updatedUser, userProfile: updatedProfile };
      },
      ({ user: updatedUser }) => {
        // Only fields that actually changed, per identity.user.profile_updated's contract
        // ("changed: { name?, username?, bio?, address?, profilePicture? }") -- additive,
        // not a full snapshot, so consumers only react to what moved.
        const changed: Record<string, string> = {};
        if (updatedUser.name !== existingUser.name) changed.name = updatedUser.name ?? "";
        if (updatedUser.username !== existingUser.username) changed.username = updatedUser.username;
        if (newBio !== (existingUser.userProfile!.bio ?? "")) changed.bio = newBio;
        if (newAddress !== (existingUser.userProfile!.address ?? "")) changed.address = newAddress;
        if (imageUrl) changed.profilePicture = imageUrl;

        if (Object.keys(changed).length === 0) return null;

        return {
          type: "identity.user.profile_updated",
          subject: `user:${updatedUser.id}`,
          producer: "identity",
          actorUserId: updatedUser.id,
          payload: { userId: updatedUser.id, changed },
        };
      }
    );

    res.status(200).send({
      ok: true,
      user: { ...user, userProfile },
      msg: "updated successfully",
    });
  } catch (error) {
    logger.error("Failed to update user profile", error, {
      requestId: req.headers["x-request-id"],
      userId: req.query.userId,
    });
    next(error);
  }
}

export async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const users = await prisma.user.findMany({
      orderBy: { firstname: "asc" },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        name: true,
        username: true,
        role: true,
        identifier: true,
        profilePicture: true,
        userProfile: true,
      },
    });
    res.status(200).send({ users });
  } catch (error) {
    next(error);
  }
}

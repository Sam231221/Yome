import type { Request, Response, NextFunction } from "express";
import getPrismaInstance from "@repo/database";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  assertAllowedMimeType,
  createLogger,
  groupData,
  uploadBufferToS3,
} from "@repo/shared";

const logger = createLogger("user");

function getAuthenticatedUserId(req: Request): number | null {
  const raw = req.headers["x-user-id"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number.parseInt(String(value ?? ""), 10);
  return Number.isNaN(id) ? null : id;
}

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
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
  next: NextFunction
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

    const user = await prisma.user.update({
      where: { id: userId },
      data: userUpdateData as Parameters<typeof prisma.user.update>[0]["data"],
    });
    const userProfile = await prisma.userProfile.update({
      where: { id: existingUser.userProfile.id },
      data: { bio: bio ?? "", address: address ?? "" },
    });
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
  next: NextFunction
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

export async function getFollowedUsersByUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
    const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
    if (Number.isNaN(loggedInUserId)) {
      res.status(400).json({ ok: false, error: "Invalid user id" });
      return;
    }
    if (authenticatedUserId !== loggedInUserId) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: loggedInUserId },
      include: {
        following: { include: { userProfile: true } },
      },
    });
    const followedUsers = user?.following ?? [];
    res.status(200).send({ followedUsers });
  } catch (error) {
    next(error);
  }
}

export async function getUnfollowedMentors(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
    const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
    if (Number.isNaN(loggedInUserId)) {
      res.status(400).json({ ok: false, error: "Invalid user id" });
      return;
    }
    if (authenticatedUserId !== loggedInUserId) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }
    const prisma = getPrismaInstance();
    const mentorsNotFollowed = await prisma.user.findMany({
      where: {
        role: "MENTOR",
        NOT: { followers: { some: { id: loggedInUserId } } },
        id: { not: loggedInUserId },
      },
    });
    res.status(200).json({ mentorsNotFollowed });
  } catch (error) {
    next(error);
  }
}

export async function getUnassociatedGroupsForUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authenticatedUserId = getAuthenticatedUserId(req);
  if (authenticatedUserId === null) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }
  const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
  if (Number.isNaN(loggedInUserId)) {
    res.status(400).json({ msg: "Invalid user id", unassociatedGroups: [] });
    return;
  }
  if (authenticatedUserId !== loggedInUserId) {
    res.status(403).json({ ok: false, error: "Forbidden" });
    return;
  }
  try {
    const prisma = getPrismaInstance();
    const unassociatedGroups = await prisma.group.findMany({
      where: {
        NOT: {
          OR: [
            { members: { some: { id: loggedInUserId } } },
            { admins: { some: { id: loggedInUserId } } },
          ],
        },
      },
    });

    if (unassociatedGroups.length === 0) {
      const totalGroups = await prisma.group.count();
      if (totalGroups === 0 && groupData.length > 0) {
        const allUsers = await prisma.user.findMany({
          select: { id: true },
          orderBy: { id: "asc" },
        });
        const oneBasedIndex =
          allUsers.findIndex((u: { id: number }) => u.id === loggedInUserId) + 1;
        const fromData = groupData
          .map((data, index) => ({ data, index }))
          .filter(
            ({ data }) =>
              ![
                ...(data.adminUserIDs ?? []),
                ...(data.memberUserIDs ?? []),
              ].includes(oneBasedIndex)
          )
          .map(({ data, index }) => ({
            id: `groupData-${index}`,
            name: data.name ?? "Untitled group",
            about: data.about ?? "Community group on Yome",
            thumbnail: data.thumbnail ?? "",
          }));
        res.status(200).json({ unassociatedGroups: fromData });
        return;
      }
    }
    res.status(200).json({ unassociatedGroups });
  } catch (error) {
    next(error);
  }
}

export async function getAllGroupsForUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
    const loggedInUserId = parseInt(String(req.params.loggedInUserId ?? ""), 10);
    if (Number.isNaN(loggedInUserId)) {
      res.status(400).json({ ok: false, error: "Invalid user id" });
      return;
    }
    if (authenticatedUserId !== loggedInUserId) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { members: { some: { id: loggedInUserId } } },
          { admins: { some: { id: loggedInUserId } } },
        ],
      },
    });
    res.status(200).send({ groups });
  } catch (error) {
    next(error);
  }
}

export async function getAllGroups(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const groups = await prisma.group.findMany({
      orderBy: { name: "asc" },
    });
    res.status(200).send({ groups });
  } catch (error) {
    next(error);
  }
}

export async function followUnfollowedUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { loggedInUserId, mentorId } = req.body as {
    loggedInUserId?: number;
    mentorId?: string;
  };
  try {
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
    const requesterId = Number(loggedInUserId);
    if (Number.isNaN(requesterId)) {
      res.status(400).send("Invalid loggedInUserId.");
      return;
    }
    if (authenticatedUserId !== requesterId) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }
    const mentorIdAsNumber = parseInt(String(mentorId ?? ""), 10);
    if (Number.isNaN(mentorIdAsNumber)) {
      res.status(400).send("Invalid mentor id.");
      return;
    }
    const prisma = getPrismaInstance();
    const userToFollow = await prisma.user.findUnique({
      where: { id: mentorIdAsNumber },
    });
    if (!userToFollow || userToFollow.id === requesterId) {
      res.status(400).send("Invalid user to follow.");
      return;
    }
    const isFollowing = await prisma.user.count({
      where: {
        id: requesterId,
        following: { some: { id: mentorIdAsNumber } },
      },
    });
    if (isFollowing > 0) {
      res.status(400).send("You are already following this user.");
      return;
    }
    await prisma.user.update({
      where: { id: requesterId },
      data: { following: { connect: { id: mentorIdAsNumber } } },
    });
    res.status(200).send({ status: 200, msg: "Successfully followed the user." });
  } catch (error) {
    next(error);
  }
}

export async function joinUnjoinedGroups(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { loggedInUserId, groupIdToJoin } = req.body as {
    loggedInUserId?: number | string;
    groupIdToJoin?: string;
  };
  const userId =
    typeof loggedInUserId === "number"
      ? loggedInUserId
      : parseInt(String(loggedInUserId), 10);
  if (Number.isNaN(userId)) {
    res.status(400).json({ msg: "Invalid user id." });
    return;
  }
  try {
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
    if (authenticatedUserId !== userId) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }
    const prisma = getPrismaInstance();
    let groupId: string = groupIdToJoin!;

    if (
      typeof groupIdToJoin === "string" &&
      groupIdToJoin.startsWith("groupData-")
    ) {
      const index = parseInt(groupIdToJoin.replace("groupData-", ""), 10);
      if (
        Number.isNaN(index) ||
        index < 0 ||
        index >= groupData.length
      ) {
        res.status(400).json({ msg: "Invalid group to join." });
        return;
      }
      const data = groupData[index]!;
      const allUsers = await prisma.user.findMany({
        select: { id: true },
        orderBy: { id: "asc" },
      });
      const mapUserId = (oldId: number) => {
        const i = oldId - 1;
        return i < allUsers.length ? allUsers[i]!.id : null;
      };
      let group = await prisma.group.findFirst({
        where: { name: data.name },
      });
      if (!group) {
        const actualAdminIds = (data.adminUserIDs ?? [])
          .map(mapUserId)
          .filter((id): id is number => id !== null);
        const actualMemberIds = (data.memberUserIDs ?? [])
          .map(mapUserId)
          .filter((id): id is number => id !== null);
        group = await prisma.group.create({
          data: {
            name: data.name,
            about: data.about ?? "",
            thumbnail: data.thumbnail ?? "",
            admins:
              actualAdminIds.length > 0
                ? { connect: actualAdminIds.map((id) => ({ id })) }
                : undefined,
            members:
              actualMemberIds.length > 0
                ? { connect: actualMemberIds.map((id) => ({ id })) }
                : undefined,
          },
        });
      }
      groupId = group.id;
    }

    const groupToJoin = await prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!groupToJoin) {
      res.status(400).json({ msg: "Invalid group to join." });
      return;
    }
    const isMemberOrAdmin = await prisma.group.count({
      where: {
        id: groupId,
        OR: [
          { members: { some: { id: userId } } },
          { admins: { some: { id: userId } } },
        ],
      },
    });
    if (isMemberOrAdmin > 0) {
      res
        .status(400)
        .json({ msg: "You are already a member or admin of this group." });
      return;
    }
    await prisma.group.update({
      where: { id: groupId },
      data: { members: { connect: { id: userId } } },
    });
    res.status(200).json({ status: 200, msg: "Successfully joined the group." });
  } catch (error) {
    next(error);
  }
}

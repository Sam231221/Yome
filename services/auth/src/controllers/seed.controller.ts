import type { Request, Response } from "express";
import getPrismaInstance from "@repo/database";
import { createLogger, groupData } from "@repo/shared";
import { usersData } from "../data/users.js";
import bcryptjs from "bcryptjs";

const logger = createLogger("auth-seed");

function canRunSeedMutations(): boolean {
  return (
    process.env.ENABLE_DEV_SEED_ROUTES === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

function rejectIfSeedDisabled(res: Response): boolean {
  if (canRunSeedMutations()) {
    return false;
  }
  res.status(404).json({
    ok: false,
    error: "Not found",
    details: "Seed endpoints are disabled",
  });
  return true;
}

export async function createMultipleUsersWithProfiles(
  _req: Request,
  res: Response
): Promise<void> {
  if (rejectIfSeedDisabled(res)) return;
  try {
    const prisma = getPrismaInstance();
    const usersWithHashedPasswords = await Promise.all(
      usersData.map(async (userData) => {
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(userData.password, salt);
        return { ...userData, password: hashedPassword };
      })
    );

    const createdUsers: Array<{ user: unknown; userProfile: unknown; status: string }> = [];
    for (const userData of usersWithHashedPasswords) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
        include: { userProfile: true },
      });

      if (existingUser) {
        const updatedUser = await prisma.user.update({
          where: { email: userData.email },
          data: {
            firstname: userData.firstname,
            lastname: userData.lastname,
            name: userData.firstname + " " + userData.lastname,
            username: userData.username,
            password: userData.password,
            role: userData.role,
            profilePicture: userData.thumbnail,
          },
        });

        let userProfile = existingUser.userProfile;
        if (userProfile) {
          userProfile = await prisma.userProfile.update({
            where: { id: userProfile.id },
            data: { bio: userData.bio, address: userData.address },
          });
        } else {
          userProfile = await prisma.userProfile.create({
            data: { bio: userData.bio, address: userData.address },
          });
          await prisma.user.update({
            where: { id: updatedUser.id },
            data: { userProfile: { connect: { id: userProfile.id } } },
          });
        }
        createdUsers.push({
          user: updatedUser,
          userProfile,
          status: "updated",
        });
      } else {
        const newUserProfile = await prisma.userProfile.create({
          data: { bio: userData.bio, address: userData.address },
        });
        const newUser = await prisma.user.create({
          data: {
            email: userData.email,
            firstname: userData.firstname,
            lastname: userData.lastname,
            name: userData.firstname + " " + userData.lastname,
            username: userData.username,
            password: userData.password,
            role: userData.role,
            profilePicture: userData.thumbnail,
            userProfile: { connect: { id: newUserProfile.id } },
          },
        });
        createdUsers.push({
          user: newUser,
          userProfile: newUserProfile,
          status: "created",
        });
      }
    }
    res.status(201).json({ createdUsers });
  } catch (error) {
    logger.error("Failed to create users and profiles", error);
    res.status(500).json({
      error: "Unable to create users and profiles",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function createEducationGroups(
  _req: Request,
  res: Response
): Promise<void> {
  if (rejectIfSeedDisabled(res)) return;
  try {
    const prisma = getPrismaInstance();
    const allUsers = await prisma.user.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
    });

    if (allUsers.length === 0) {
      res.status(400).json({
        error:
          "No users found. Please create users first using /api/db/create-multiple-users",
      });
      return;
    }

    const createdGroups: Array<{ group: unknown; status: "created" | "updated" }> = [];
    for (const data of groupData) {
      const { name, about, thumbnail, adminUserIDs, memberUserIDs } = data;
      const mapUserId = (oldId: number) => {
        const index = oldId - 1;
        return index < allUsers.length ? allUsers[index]!.id : null;
      };
      const actualAdminIds = adminUserIDs.map(mapUserId).filter((id): id is number => id !== null);
      const actualMemberIds = memberUserIDs.map(mapUserId).filter((id): id is number => id !== null);

      if (actualAdminIds.length === 0 && actualMemberIds.length === 0) {
        logger.warn("Skipping group with no valid user IDs", { name });
        continue;
      }

      const existingGroup = await prisma.group.findUnique({
        where: { name },
        select: { id: true },
      });

      const groupPayload = {
        name,
        about,
        thumbnail: thumbnail ?? "",
      };

      if (existingGroup) {
        const updatedGroup = await prisma.group.update({
          where: { name },
          data: {
            ...groupPayload,
            admins: { set: actualAdminIds.map((id) => ({ id })) },
            members: { set: actualMemberIds.map((id) => ({ id })) },
          },
        });
        createdGroups.push({ group: updatedGroup, status: "updated" });
        logger.info("Updated group", { name });
      } else {
        const newGroup = await prisma.group.create({
          data: {
            ...groupPayload,
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
        createdGroups.push({ group: newGroup, status: "created" });
        logger.info("Created group", { name });
      }
    }

    res.status(201).json({
      createdGroups,
      message: `Successfully created ${createdGroups.length} groups`,
    });
  } catch (error) {
    logger.error("Failed to create education groups", error);
    res.status(500).json({
      error: "Unable to create education groups",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function deleteAllRecords(
  _req: Request,
  res: Response
): Promise<void> {
  if (rejectIfSeedDisabled(res)) return;
  try {
    const prisma = getPrismaInstance();
    await prisma.messages.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.group.deleteMany();
    res.status(200).json({ message: "All records deleted successfully" });
  } catch (error) {
    logger.error("Failed to delete seed records", error);
    res.status(500).json({ error: "Unable to delete records" });
  }
}

import type { Request, Response } from "express";
import getPrismaInstance from "@repo/database";
import { createLogger, groupData } from "@repo/shared";
import { usersData } from "../data/users.js";
import { resourcesData } from "../data/resources.js";
import bcryptjs from "bcryptjs";

const logger = createLogger("auth-seed");

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

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
          "No users found. Please create users first using /api/dev/db/seed-users",
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
        slug: "slug" in data && data.slug ? data.slug : slugify(name),
        name,
        about,
        subject: "subject" in data && data.subject ? data.subject : "General",
        category: "category" in data && data.category ? data.category : "Community",
        tone: "tone" in data && data.tone ? data.tone : "blue",
        symbol: "symbol" in data && data.symbol ? data.symbol : "Y",
        privacy: "privacy" in data && data.privacy ? data.privacy : "Public group",
        location: "location" in data && data.location ? data.location : "Global",
        featured: "featured" in data ? Boolean(data.featured) : false,
        activeThisWeek:
          "activeThisWeek" in data && typeof data.activeThisWeek === "number"
            ? data.activeThisWeek
            : actualMemberIds.length + actualAdminIds.length,
        projectCount:
          "projectCount" in data && typeof data.projectCount === "number"
            ? data.projectCount
            : 0,
        mentorCount:
          "mentorCount" in data && typeof data.mentorCount === "number"
            ? data.mentorCount
            : actualAdminIds.length,
        thumbnail: thumbnail ?? "",
      };

      const tags =
        "tags" in data && Array.isArray(data.tags)
          ? data.tags.map((label, index) => ({
              label,
              tone: index === 0 ? groupPayload.tone : "neutral",
            }))
          : [{ label: groupPayload.subject, tone: groupPayload.tone }];
      const announcements =
        "announcements" in data && Array.isArray(data.announcements)
          ? data.announcements
          : [];
      const events =
        "events" in data && Array.isArray(data.events) ? data.events : [];
      const invitedUserIds =
        "invitedUserIDs" in data && Array.isArray(data.invitedUserIDs)
          ? data.invitedUserIDs.map(mapUserId).filter((id): id is number => id !== null)
          : [];

      if (existingGroup) {
        const updatedGroup = await prisma.group.update({
          where: { name },
          data: {
            ...groupPayload,
            admins: { set: actualAdminIds.map((id) => ({ id })) },
            members: { set: actualMemberIds.map((id) => ({ id })) },
            tags: {
              deleteMany: {},
              create: tags,
            },
            announcements: {
              deleteMany: {},
              create: announcements.map((announcement) => ({
                title: announcement.title,
                body: announcement.body,
                ctaLabel: "ctaLabel" in announcement ? announcement.ctaLabel : undefined,
                ctaHref: "ctaHref" in announcement ? announcement.ctaHref : undefined,
                pinned: "pinned" in announcement ? Boolean(announcement.pinned) : false,
                authorId: actualAdminIds[0],
              })),
            },
            events: {
              deleteMany: {},
              create: events.map((event) => ({
                title: event.title,
                type: event.type,
                startsAt: new Date(Date.now() + event.daysFromNow * 24 * 60 * 60 * 1000),
                location: event.location,
                tone: event.tone,
              })),
            },
            invitations: {
              deleteMany: {},
              create: invitedUserIds.map((userId) => ({ userId })),
            },
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
            tags: { create: tags },
            announcements: {
              create: announcements.map((announcement) => ({
                title: announcement.title,
                body: announcement.body,
                ctaLabel: "ctaLabel" in announcement ? announcement.ctaLabel : undefined,
                ctaHref: "ctaHref" in announcement ? announcement.ctaHref : undefined,
                pinned: "pinned" in announcement ? Boolean(announcement.pinned) : false,
                authorId: actualAdminIds[0],
              })),
            },
            events: {
              create: events.map((event) => ({
                title: event.title,
                type: event.type,
                startsAt: new Date(Date.now() + event.daysFromNow * 24 * 60 * 60 * 1000),
                location: event.location,
                tone: event.tone,
              })),
            },
            invitations: {
              create: invitedUserIds.map((userId) => ({ userId })),
            },
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

export async function createLearningResources(
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
          "No users found. Please create users first using /api/dev/db/seed-users",
      });
      return;
    }

    const seededResources: Array<{ resource: unknown; status: "created" | "updated" }> = [];
    for (const resourceData of resourcesData) {
      const authorId =
        allUsers[resourceData.authorIndex]?.id ?? allUsers[0]?.id;
      if (!authorId) continue;
      const group =
        "groupSlug" in resourceData && resourceData.groupSlug
          ? await prisma.group.findUnique({
              where: { slug: resourceData.groupSlug },
              select: { id: true },
            })
          : null;

      const existingResource = await prisma.resource.findUnique({
        where: { slug: resourceData.slug },
        select: { id: true },
      });
      const resourcePayload = {
        slug: resourceData.slug,
        title: resourceData.title,
        subject: resourceData.subject,
        topic: resourceData.topic,
        level: resourceData.level,
        type: resourceData.type,
        tone: resourceData.tone,
        description: resourceData.description,
        fileUrl: "fileUrl" in resourceData ? resourceData.fileUrl : undefined,
        externalUrl:
          "externalUrl" in resourceData ? resourceData.externalUrl : undefined,
        saveCount: resourceData.saveCount,
        helpfulCount: resourceData.helpfulCount,
        ratingAverage: resourceData.ratingAverage,
        ratingCount: resourceData.ratingCount,
        author: { connect: { id: authorId } },
        group: group ? { connect: { id: group.id } } : undefined,
      };

      if (existingResource) {
        const resource = await prisma.resource.update({
          where: { slug: resourceData.slug },
          data: resourcePayload,
        });
        seededResources.push({ resource, status: "updated" });
      } else {
        const resource = await prisma.resource.create({
          data: resourcePayload,
        });
        seededResources.push({ resource, status: "created" });
      }
    }

    res.status(201).json({
      seededResources,
      message: `Successfully seeded ${seededResources.length} resources`,
    });
  } catch (error) {
    logger.error("Failed to create learning resources", error);
    res.status(500).json({
      error: "Unable to create learning resources",
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
    await prisma.resourceHelpfulVote.deleteMany();
    await prisma.resourceSave.deleteMany();
    await prisma.resource.deleteMany();
    await prisma.groupInvitation.deleteMany();
    await prisma.groupAnnouncement.deleteMany();
    await prisma.groupEvent.deleteMany();
    await prisma.groupTag.deleteMany();
    await prisma.messages.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();
    await prisma.userProfile.deleteMany();
    res.status(200).json({ message: "All records deleted successfully" });
  } catch (error) {
    logger.error("Failed to delete seed records", error);
    res.status(500).json({ error: "Unable to delete records" });
  }
}

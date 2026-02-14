import getPrismaInstance from "../utils/PrismaClient.js";
import { usersData } from "../data/users.js";
import { groupData } from "../data/groups.js";

import bcryptjs from "bcryptjs";

export const createMultipleUsersWithProfiles = async (req, res) => {
  try {
    const prisma = getPrismaInstance();
    // Hash passwords for each user
    const usersWithHashedPasswords = await Promise.all(
      usersData.map(async (userData) => {
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(userData.password, salt);

        return { ...userData, password: hashedPassword };
      })
    );

    // Upsert users and profiles so the endpoint is idempotent (safe to call again).
    // Schema: User.userProfileId -> UserProfile.id, so create/connect UserProfile first, then User.
    const createdUsers = [];
    for (const userData of usersWithHashedPasswords) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
        include: { userProfile: true },
      });

      if (existingUser) {
        // Update existing user and profile
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

        createdUsers.push({ user: updatedUser, userProfile, status: "updated" });
      } else {
        // Create new profile then user
        const newUserProfile = await prisma.userProfile.create({
          data: {
            bio: userData.bio,
            address: userData.address,
          },
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
            userProfile: {
              connect: { id: newUserProfile.id },
            },
          },
        });

        createdUsers.push({ user: newUser, userProfile: newUserProfile, status: "created" });
      }
    }

    return res.status(201).json({ createdUsers });
  } catch (error) {
    console.error("Error creating users and profiles:", error);
    res.status(500).json({
      error: "Unable to create users and profiles",
      details: error?.message ?? String(error),
    });
  }
};

export const createEducationGroups = async (req, res) => {
  try {
    const prisma = getPrismaInstance();

    // Get all existing users from the database
    const allUsers = await prisma.user.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
    });

    if (allUsers.length === 0) {
      return res.status(400).json({
        error:
          "No users found. Please create users first using /api/db/create-multiple-users",
      });
    }

    // Get the range of user IDs
    const userIds = allUsers.map((user) => user.id);
    const minUserId = Math.min(...userIds);
    const maxUserId = Math.max(...userIds);

    console.log(
      `Found ${allUsers.length} users with IDs from ${minUserId} to ${maxUserId}`
    );

    const createdGroups = [];

    for (const data of groupData) {
      const { name, about, thumbnail, adminUserIDs, memberUserIDs } = data;

      // Map the hardcoded IDs to actual database IDs
      // If hardcoded ID is 1, use minUserId; if 2, use minUserId+1, etc.
      const mapUserId = (oldId) => {
        const index = oldId - 1;
        return index < allUsers.length ? allUsers[index].id : null;
      };

      // Filter out null IDs (in case we have fewer users than expected)
      const actualAdminIds = adminUserIDs
        .map(mapUserId)
        .filter((id) => id !== null);

      const actualMemberIds = memberUserIDs
        .map(mapUserId)
        .filter((id) => id !== null);

      if (actualAdminIds.length === 0 && actualMemberIds.length === 0) {
        console.warn(`Skipping group "${name}" - no valid user IDs`);
        continue;
      }

      const newGroup = await prisma.group.create({
        data: {
          name,
          about,
          thumbnail: thumbnail,
          admins:
            actualAdminIds.length > 0
              ? { connect: actualAdminIds.map((userID) => ({ id: userID })) }
              : undefined,
          members:
            actualMemberIds.length > 0
              ? { connect: actualMemberIds.map((userID) => ({ id: userID })) }
              : undefined,
        },
      });

      createdGroups.push(newGroup);
      console.log(`Created group: ${name}`);
    }

    return res.status(201).json({
      createdGroups,
      message: `Successfully created ${createdGroups.length} groups`,
    });
  } catch (error) {
    console.error("Error creating education groups:", error);
    res.status(500).json({
      error: "Unable to create education groups",
      details: error.message,
    });
  }
};

export const createEducationalUtils = async (req, res) => {
  try {
    const prisma = getPrismaInstance();

    const {
      albums,
      infrastructure,
      programs,
      faculty,
      extraActivities,
      cost,
      alumniSuccess,
    } = institutionsUtils;

    await prisma.album.createMany({
      data: albums,
    });

    await prisma.infrastructure.createMany({
      data: infrastructure,
    });

    await prisma.program.createMany({
      data: programs,
    });

    await prisma.faculty.createMany({
      data: faculty,
    });

    await prisma.extracurricularActivity.createMany({
      data: extraActivities,
    });

    await prisma.cost.createMany({
      data: cost,
    });

    await prisma.alumniSuccess.createMany({
      data: alumniSuccess,
    });

    res.status(201).json({ msg: "successfull" });
  } catch (error) {
    console.error("Error creating educational utils:", error);
    res.status(500).json({ error: "Unable to create educational utils" });
  }
};

export const createEducationalInstitutions = async (req, res) => {
  try {
    const prisma = getPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is undefined.");
    }

    const createdInstitutions = await Promise.all(
      institutionsData.map(async (data) => {
        const {
          ownerId,
          albumIds,
          insfrastructureIds,
          programsIds,
          facultyIds,
          extraActivitiesIds,
          costIds,
          alumniSuccessIds,
          ...institutionData
        } = data;

        const owner = ownerId ? { connect: { id: ownerId } } : undefined;

        return await prisma.educationalInstitution.create({
          data: {
            ...institutionData,
            owner,
            albums: { connect: albumIds.map((id) => ({ id: id })) },
            infrastructure: {
              connect: insfrastructureIds.map((id) => ({ id: id })),
            },
            programs: { connect: programsIds.map((id) => ({ id: id })) },
            faculty: { connect: facultyIds.map((id) => ({ id: id })) },
            extraActivities: {
              connect: extraActivitiesIds.map((id) => ({ id: id })),
            },
            cost: { connect: costIds.map((id) => ({ id: id })) },
            alumniSuccess: {
              connect: alumniSuccessIds.map((id) => ({ id: id })),
            },
          },
        });
      })
    );

    res.status(201).json({ createdInstitutions });
  } catch (error) {
    console.error("Error creating educational institutions:", error);
    res
      .status(500)
      .json({ error: "Unable to create educational institutions" });
  }
};

export const deleteAllRecords = async (req, res) => {
  try {
    await prisma.messages.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.educationalInstitution.deleteMany();
    await prisma.group.deleteMany();

    res.status(200).json({ message: "All records deleted successfully" });
  } catch (error) {
    console.error("Error deleting records:", error);
    res.status(500).json({ error: "Unable to delete records" });
  }
};

import getPrismaInstance from "../utils/PrismaClient.js";
import { usersData } from "../data/users.js";
import { groupData } from "../data/groups.js";
import {
  institutionsData,
  institutionsUtils,
} from "../data/educationalInstitutions.js";
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

    // Create users and user profiles in a loop
    const createdUsers = [];
    for (const userData of usersWithHashedPasswords) {
      const newUser = await prisma.user.create({
        data: {
          email: userData.email,
          firstname: userData.firstname,
          lastname: userData.lastname,
          username: userData.username,
          password: userData.password,
          role: userData.role,
          // Add other user-related data here as needed
        },
      });

      const newUserProfile = await prisma.userProfile.create({
        data: {
          bio: userData.bio,
          address: userData.address,
          user: {
            connect: {
              id: newUser.id,
            },
          },
        },
      });

      createdUsers.push({ user: newUser, userProfile: newUserProfile });
    }

    return res.status(201).json({ createdUsers });
  } catch (error) {
    res.status(500).json({ error: "Unable to create users and profiles" });
  }
};

export const createEducationGroups = async (req, res) => {
  try {
    const prisma = getPrismaInstance();
    const createdGroups = [];
    for (const data of groupData) {
      const { name, about, adminUserIDs, memberUserIDs } = data;

      const newGroup = await prisma.group.create({
        data: {
          name,
          about,
          thumbnail: "", // You can specify a thumbnail here if available
          admins: { connect: adminUserIDs.map((userID) => ({ id: userID })) },
          members: { connect: memberUserIDs.map((userID) => ({ id: userID })) },
        },
      });

      createdGroups.push(newGroup);
    }

    return res.status(201).json({ createdGroups });
  } catch (error) {
    console.error("Error creating education groups:", error);
    res.status(500).json({ error: "Unable to create education groups" });
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

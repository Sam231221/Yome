import getPrismaInstance from "../utils/PrismaClient.js";
import { generateToken04 } from "../utils/TokenGenerator.js";
import bcryptjs from "bcryptjs";
export const getUserByEmail = async (request, response, next) => {
  try {
    const { email } = request.body;
    if (!email) {
      return response.json({ msg: "Email is required", status: false });
    }
    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return response.json({ msg: "User not found", status: false });
    } else
      return response.json({ msg: "User Found", status: true, user: user });
  } catch (error) {
    next(error);
  }
};
export const getGroupById = async (request, response, next) => {
  try {
    const { groupId } = request.body;
    if (!groupId) {
      return response.json({ msg: "Email is required", status: false });
    }
    const prisma = getPrismaInstance();
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });
    if (!group) {
      return response.json({ msg: "Group not found", status: false });
    } else
      return response.json({ msg: "Group Found", status: true, group: group });
  } catch (error) {
    console.log(error);
  }
};
export const onBoardUser = async (request, response, next) => {
  try {
    const prisma = getPrismaInstance();
    const { email, username, password } = request.body;
    if (!email || !username || !password) {
      return response.json({
        msg: "Email, Name and Password are required",
        status: 400,
      });
    }
    const existingUserbyEmail = await prisma.user.findUnique({
      where: { email: email },
    });
    const existingUserbyName = await prisma.user.findUnique({
      where: { name: username },
    });
    if (existingUserbyName || existingUserbyEmail) {
      return response.json({ msg: "User already exists", status: 409 });
    } else {
      //hash password
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(password, salt);

      const user = await prisma.user.create({
        data: { email, name: username, password: hashedPassword },
      });
      return response.json({
        msg: "User Created Successfully",
        status: 200,
        data: user,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        identifier: true,
        profilePicture: true,
      },
    });

    return res.status(200).send({ users: users });
  } catch (error) {
    next(error);
  }
};

export const getFollowedUsersByUser = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const loggedInUserId = parseInt(req.params.loggedInUserId);

    const user = await prisma.user.findUnique({
      where: { id: loggedInUserId },
      include: { following: true },
    });

    // Extract the users followed by the logged-in user
    const followedUsers = user.following;
    return res.status(200).send({ followedUsers: followedUsers });
  } catch (error) {
    next(error);
  }
};

export const getUnfollowedMentors = async (req, res, next) => {
  const loggedInUserId = parseInt(req.params.loggedInUserId);

  try {
    const prisma = getPrismaInstance();
    const mentorsNotFollowed = await prisma.user.findMany({
      where: {
        role: "MENTOR",
        NOT: {
          followers: { some: { id: loggedInUserId } },
        },
        id: { not: loggedInUserId },
      },
    });

    return res.status(200).json({ mentorsNotFollowed });
  } catch (error) {
    next(error);
  }
};

export const getUnassociatedGroupsForUser = async (req, res, next) => {
  const loggedInUserId = parseInt(req.params.loggedInUserId);

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

    return res.status(200).json({ unassociatedGroups });
  } catch (error) {
    next(error);
  }
};

export const getAllGroupsForUser = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const loggedInUserId = parseInt(req.params.loggedInUserId);

    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { members: { some: { id: loggedInUserId } } },
          { admins: { some: { id: loggedInUserId } } },
        ],
      },
    });
    return res.status(200).send({ groups: groups });
  } catch (error) {
    next(err);
  }
};

export const getAllGroups = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const groups = await prisma.group.findMany({
      orderBy: { name: "asc" },
    });

    return res.status(200).send({ groups });
  } catch (error) {
    next(error);
  }
};

export const followUnfollowedUser = async (req, res, next) => {
  const { loggedInUserId, mentorId } = req.body;

  try {
    const prisma = getPrismaInstance();
    // Check if the user to follow exists and is not the logged-in user
    const userToFollow = await prisma.user.findUnique({
      where: { id: parseInt(mentorId) },
    });

    if (!userToFollow || userToFollow.id === loggedInUserId) {
      return res.status(400).send("Invalid user to follow.");
    }

    // Check if the logged-in user is already following the user
    const isFollowing = await prisma.user.count({
      where: {
        id: loggedInUserId,
        following: { some: { id: parseInt(mentorId) } },
      },
    });

    if (isFollowing > 0) {
      return res.status(400).send("You are already following this user.");
    }

    // Connect the logged-in user to the user they want to follow
    await prisma.user.update({
      where: { id: loggedInUserId },
      data: { following: { connect: { id: parseInt(mentorId) } } },
    });

    res
      .status(200)
      .send({ status: 200, msg: "Successfully followed the user." });
  } catch (error) {
    next(error);
  }
};

export const joinUnjoinedGroups = async (req, res, next) => {
  const { loggedInUserId, groupIdToJoin } = req.body; // Assuming groupIdToJoin is passed as a parameter

  try {
    const prisma = getPrismaInstance();
    // Check if the group to join exists
    const groupToJoin = await prisma.group.findUnique({
      where: { id: groupIdToJoin },
    });

    if (!groupToJoin) {
      return res.status(400).send("Invalid group to join.");
    }

    // Check if the logged-in user is already a member or admin of the group
    const isMemberOrAdmin = await prisma.group.count({
      where: {
        id: groupIdToJoin,
        OR: [
          { members: { some: { id: loggedInUserId } } },
          { admins: { some: { id: loggedInUserId } } },
        ],
      },
    });

    if (isMemberOrAdmin > 0) {
      return res
        .status(400)
        .send("You are already a member or admin of this group.");
    }

    // Connect the logged-in user to the group they want to join as a member
    await prisma.group.update({
      where: { id: groupIdToJoin },
      data: { members: { connect: { id: loggedInUserId } } },
    });

    res
      .status(200)
      .send({ status: 200, msg: "Successfully joined the group." });
  } catch (error) {
    next(error);
    res.status(500).send("Error joining the group.");
  }
};

export const generateToken = (req, res, next) => {
  try {
    const appID = parseInt(process.env.ZEGO_APP_ID);
    const serverSecret = process.env.ZEGO_APP_SECRET;
    const userId = req.params.userId;
    const effectiveTimeInSeconds = 3600;
    const payload = "";
    if (appID && serverSecret && userId) {
      const token = generateToken04(
        appID,
        userId,
        serverSecret,
        effectiveTimeInSeconds,
        payload
      );
      res.status(200).json({ token });
    }
    return res
      .status(400)
      .send("User id, app id and server secret is required");
  } catch (err) {
    next(err);
  }
};

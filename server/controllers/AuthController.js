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
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return response.json({ msg: "Group not found", status: false });
    } else
      return response.json({ msg: "Group Found", status: true, group: group });
  } catch (error) {
    next(error);
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
        profilePicture: true,
        about: true,
      },
    });

    return res.status(200).send({ users: users });
  } catch (error) {
    next(error);
  }
};
export const getAllGroups = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const groups = await prisma.group.findMany({
      orderBy: { name: "asc" },
    });

    return res.status(200).send({ groups: groups });
  } catch (error) {
    next(error);
  }
};

export const getAllUserOfaGroup = async (groupId) => {
  try {
    const prisma = getPrismaInstance();
    const usersInGroup = await prisma.group.findUnique({
      where: {
        id: groupId, // Replace with the actual group ID
      },
    });

    return usersInGroup;
  } catch (error) {
    console.error("Error fetching users in group:", error);
    throw error;
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
    console.log({ err });
    next(err);
  }
};

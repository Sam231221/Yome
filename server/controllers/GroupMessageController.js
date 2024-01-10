import { renameSync } from "fs";
import getPrismaInstance from "../utils/PrismaClient.js";
export const addGroupMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();

    const { message, from, group_id } = req.body;
    const getUser = onlineUsers.get(to);

    if (message && from) {
      const newMessage = await prisma.messages.create({
        data: {
          message: message,
          sender: { connect: { id: parseInt(from) } },
          messageStatus: getUser ? "delivered" : "sent",
        },
        include: { sender: true, reciever: true },
      });
      const getGroupById = await prisma.group.findUnique({
        where: {
          id: group_id,
        },
      });
      getGroupById.messages.add(newMessage);
      return res.status(201).send({ message: newMessage });
    }
    return res.status(400).send("From, Room and Message is required.");
  } catch (err) {
    next(err);
  }
};

export const getGroupMessages = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { group_id } = req.params;
    const messages = await prisma.messages.findMany({
      where: {
        groupId: parseInt(group_id),
      },
      orderBy: {
        id: "asc",
      },
    });

    res.status(200).json({ messages });
  } catch (err) {
    next(err);
  }
};

export const getInitialGroupsWithMessages = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.group_id);
    const prisma = getPrismaInstance();
    // Retrieve groups with the latest message (sent by any user in the group)
    const groupsWithLatestMessages = await prisma.group.findMany({
      where: {
        AND: [
          {
            OR: [
              { members: { some: { id: userId } } },
              { admins: { some: { id: userId } } },
            ],
          },
          { messages: { some: { groupId: { not: null } } } }, // Group has at least one message
        ],
      },
      include: {
        messages: {
          where: { groupId: { not: null } },
          take: 1,
          orderBy: { createdAt: "desc" }, // Get the latest message
        },
      },
    });

    //passes  users and onlineUsers to the List.jsx
    return res.status(200).json({
      groupsWithLatestGroupMessages: groupsWithLatestMessages,
      // onlineUsers: Array.from(onlineUsers.keys()),
    });
  } catch (err) {
    next(err);
  }
};

export const addGroupAudioMessage = async (req, res, next) => {
  try {
    if (req.file) {
      const date = Date.now();
      let fileName = "uploads/recordings/" + date + req.file.originalname;
      renameSync(req.file.path, fileName);
      const prisma = getPrismaInstance();
      const { from, to } = req.query;
      if (from && to) {
        const message = await prisma.messages.create({
          data: {
            message: fileName,
            sender: { connect: { id: parseInt(from) } },
            reciever: { connect: { id: parseInt(to) } },
            type: "audio",
          },
        });
        return res.status(201).json({ message });
      }
      return res.status(400).send("From, to is required.");
    }
    return res.status(400).send("Audio is required.");
  } catch (err) {
    next(err);
  }
};

export const addGroupImageMessage = async (req, res, next) => {
  try {
    if (req.file) {
      const date = Date.now();
      let fileName = "uploads/images/" + date + req.file.originalname;
      renameSync(req.file.path, fileName);
      const prisma = getPrismaInstance();
      const { from, to } = req.query;
      if (from && to) {
        const message = await prisma.messages.create({
          data: {
            message: fileName,
            sender: { connect: { id: parseInt(from) } },
            reciever: { connect: { id: parseInt(to) } },
            type: "image",
          },
        });
        return res.status(201).json({ message });
      }
      return res.status(400).send("From, to is required.");
    }
    return res.status(400).send("Image is required.");
  } catch (err) {
    next(err);
  }
};

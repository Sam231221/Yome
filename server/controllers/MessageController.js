import { renameSync } from "fs";
import getPrismaInstance from "../utils/PrismaClient.js";
export const addMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();

    const { message, from, to } = req.body;
    const getUser = onlineUsers.get(to);

    if (message && from && to) {
      const newMessage = await prisma.messages.create({
        data: {
          message: message,
          sender: { connect: { id: parseInt(from) } },
          reciever: { connect: { id: parseInt(to) } },
          messageStatus: getUser ? "delivered" : "sent",
        },
        include: { sender: true, reciever: true },
      });
      return res.status(201).send({ message: newMessage });
    }
    return res.status(400).send("From, to and Message is required.");
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { from, to } = req.params;
    const messages = await prisma.messages.findMany({
      where: {
        //i want to get all messages from second person or all the messages that i sent to the second person from the chat.
        OR: [
          {
            senderId: parseInt(from),
            recieverId: parseInt(to),
          },
          {
            senderId: parseInt(to),
            recieverId: parseInt(from),
          },
        ],
      },
      orderBy: {
        id: "asc",
      },
    });

    const unreadMessages = [];
    //update in the ui currently.
    messages.forEach((message, index) => {
      if (
        message.messageStatus !== "read" &&
        message.senderId === parseInt(to)
      ) {
        messages[index].messageStatus = "read";
        unreadMessages.push(message.id);
      }
    });
    console.log(unreadMessages);

    //update it in the database too...
    await prisma.messages.updateMany({
      where: {
        id: { in: unreadMessages },
      },
      data: {
        messageStatus: "read",
      },
    });
    res.status(200).json({ messages });
  } catch (err) {
    next(err);
  }
};

export const getInitialContactsWithMessages = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.from);
    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sentMessages: {
          include: { reciever: true, sender: true },
          orderBy: { createdAt: "desc" },
        },
        recievedMessages: {
          include: { reciever: true, sender: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    const messages = [...user.sentMessages, ...user.recievedMessages];
    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    //Map ds is used
    const users = new Map();
    const messageStatusChange = [];

    messages.forEach((msg) => {
      //here  msg can be sent by himself/herself also, so we check this.
      const isSender = msg.senderId === userId;
      const calculatedId = isSender ? msg.recieverId : msg.senderId;
      //if the message is just sent but not delivered or read yet push to the msg
      // to messageStatusChange array for making it delvered or read.
      if (msg.messageStatus === "sent") {
        messageStatusChange.push(msg.id);
      }

      //if calculatedId is not present in users, then create a user(which can be sender or receiver) object with second person messages.
      if (!users.get(calculatedId)) {
        const {
          id,
          type,
          message,
          messageStatus,
          createdAt,
          senderId,
          recieverId,
        } = msg;
        let user = {
          messageId: id,
          type,
          message,
          messageStatus,
          createdAt,
          senderId,
          recieverId,
        };

        //if it is sender then create a user with the receiver messages setting un read messages to 0
        if (isSender) {
          user = {
            ...user,
            ...msg.reciever,
            //since the message is sent by us we read it at the time immediately
            totalUnreadMessages: 0,
          };
          //if it is second person then create a user with the sender messages
        } else {
          user = {
            ...user,
            ...msg.sender,
            totalUnreadMessages: messageStatus !== "read" ? 1 : 0,
          };
        }
        users.set(calculatedId, {
          ...user,
        });
      }
      // if calculatedId is already present in users then.
      //this line will be the most tiggered as we r displaying other user messages
      //also incrementing the no of messsages that are not read.
      else if (msg.messageStatus !== "read" && !isSender) {
        const user = users.get(calculatedId);
        users.set(calculatedId, {
          ...user,
          totalUnreadMessages: user.totalUnreadMessages + 1,
        });
      }
    });

    //if there are messages which are just sent but not delivered yet
    //then set it to delivered
    if (messageStatusChange.length) {
      await prisma.messages.updateMany({
        where: {
          id: { in: messageStatusChange },
        },
        data: {
          messageStatus: "delivered",
        },
      });
    }

    //passes  users and onlineUsers to the List.jsx
    return res.status(200).json({
      users: Array.from(users.values()),
      onlineUsers: Array.from(onlineUsers.keys()),
    });
  } catch (err) {
    next(err);
  }
};

export const addAudioMessage = async (req, res, next) => {
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

export const addImageMessage = async (req, res, next) => {
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

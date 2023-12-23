import { renameSync } from "fs";
import getPrismaInstance from "../utils/PrismaClient.js";
export const addMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();

    const { chatType, from, to, message } = req.body;

    //if the user is online but not read yet,
    // we wanna make  messageStatus as "delivered" else "sent"
    const getUser = onlineUsers.get(to);

    //create private msge
    if (message && from && to && chatType === "user") {
      const newMessage = await prisma.messages.create({
        data: {
          message: message,
          msgType: "user",
          sender: { connect: { id: parseInt(from) } },
          reciever: { connect: { id: parseInt(to) } },
          messageStatus: getUser ? "delivered" : "sent",
        },
        include: { sender: true, reciever: true },
      });
      return res.status(201).send({ message: newMessage });
    }
    //create group msg
    //sender->id
    //to->chat id
    if (message && from && to && chatType === "group") {
      const newMessage = await prisma.messages.create({
        data: {
          message: message,
          group: { connect: { id: to } },
          msgType: "group",
          sender: { connect: { id: parseInt(from) } },
          messageStatus: getUser ? "delivered" : "sent",
        },
        include: { sender: true, group: true },
      });
      return res.status(201).send({ message: newMessage });
    }

    return res.status(400).send("From, to and Message is required.");
  } catch (err) {
    next(err);
  }
};
// get the user with messages whose sentMessages and  recievedMessages are not null
export const getMessages = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { from, to, chatType } = req.params;
    if (chatType === "user") {
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
      messages.forEach((message, index) => {
        if (
          message.messageStatus !== "read" &&
          message.senderId === parseInt(to)
        ) {
          messages[index].messageStatus = "read";
          unreadMessages.push(message.id);
        }
      });

      //update it in the database too...
      await prisma.messages.updateMany({
        where: {
          id: { in: unreadMessages },
        },
        data: {
          messageStatus: "read",
        },
      });
      return res.status(200).json({ messages });
    }
    if (chatType === "group") {
      const messages = await prisma.messages.findMany({
        where: {
          groupId: to,
        },
        orderBy: {
          id: "asc",
        },
      });
      return res.status(200).json({ messages });
    }
  } catch (err) {
    next(err);
  }
};
//return users with extra fields including total messages,latest msg,...
export const getInitialContactsWithMessages = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.from);
    const prisma = getPrismaInstance();

    //get the user alng with 1to1 msgs.
    const userWithPrivateMessages = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sentMessages: {
          where: {
            NOT: { recieverId: null }, // Filter non-null receiverId in receivedMessages
          },
          include: { reciever: true, sender: true },
          orderBy: { createdAt: "desc" },
        },
        recievedMessages: {
          where: {
            NOT: { recieverId: null }, // Filter non-null receiverId in receivedMessages
          },
          include: { reciever: true, sender: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const messages = [
      ...userWithPrivateMessages.sentMessages,
      ...userWithPrivateMessages.recievedMessages,
    ];

    /*------------------------------------------------------------------------
    //Now we will show only one latestmessages of either chat user or sender
    //Along with unread messages on left side
    //Showing Users/Communities
    ------------------------------------------------------------------------------- */

    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const users = new Map();

    const messageStatusChange = [];

    messages.forEach((msg) => {
      //Here  Msg can be sent by himself/herself also, so we check this.
      const isSender = msg.senderId === userId;
      //either 2nd person or sender id.
      const calculatedId = isSender ? msg.recieverId : msg.senderId;
      //If the message is just sent but not delivered or read yet,
      // push to the msg
      if (msg.messageStatus === "sent") {
        messageStatusChange.push(msg.id);
      }

      //if calculatedId is not present in users,
      //then create a user(which can be sender or receiver) object with
      //second person messages.
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

        //defining user according to the "msg" obj
        //each user hold the latest msg.
        //that is to be showed on the left side as initial msg.
        let user = {
          messageId: id,
          type,
          message,
          messageStatus,
          createdAt,
          senderId,
          recieverId,
        };
        //if it is sender then create a user with the receiver messages
        if (isSender) {
          user = {
            ...user,
            ...msg.reciever,
            totalUnreadMessages: 0,
          };
        } else {
          user = {
            ...user,
            ...msg.sender,
            totalUnreadMessages: messageStatus !== "read" ? 1 : 0,
          };
        }
        users.set(calculatedId, { ...user });
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
      usersWithLatestPivateMessages: Array.from(users.values()),
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

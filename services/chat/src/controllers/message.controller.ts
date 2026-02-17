import type { Request, Response, NextFunction } from "express";
import getPrismaInstance from "@repo/database";
import { onlineUsers } from "../state/online-users.js";

export async function getMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const from = String(req.params.from ?? "");
    const to = String(req.params.to ?? "");
    const chatType = String(req.params.chatType ?? "");

    if (chatType === "user") {
      const messages = await prisma.messages.findMany({
        where: {
          OR: [
            { senderId: parseInt(from), recieverId: parseInt(to) },
            { senderId: parseInt(to), recieverId: parseInt(from) },
          ],
        },
        include: { sender: true },
        orderBy: { id: "asc" },
      });

      const unreadIds: number[] = [];
      messages.forEach(
        (
          message: (typeof messages)[number],
          index: number
        ) => {
          if (
            message.messageStatus !== "read" &&
            message.senderId === parseInt(to)
          ) {
            (messages[index] as typeof message & { messageStatus: string }).messageStatus = "read";
            unreadIds.push(message.id);
          }
        }
      );

      if (unreadIds.length > 0) {
        await prisma.messages.updateMany({
          where: { id: { in: unreadIds } },
          data: { messageStatus: "read" },
        });
      }
      res.status(200).json({ messages });
      return;
    }

    if (chatType === "group") {
      const messages = await prisma.messages.findMany({
        where: { groupId: to },
        include: { sender: true },
        orderBy: { id: "asc" },
      });
      res.status(200).json({ messages });
      return;
    }

    res.status(400).json({ ok: false, error: "Invalid chatType" });
  } catch (err) {
    next(err);
  }
}

export async function getInitialUsersWithMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = parseInt(String(req.params.from ?? ""), 10);
    const prisma = getPrismaInstance();

    const userWithPrivateMessages = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sentMessages: {
          where: { NOT: { recieverId: null } },
          include: { reciever: true, sender: true },
          orderBy: { createdAt: "desc" },
        },
        recievedMessages: {
          where: { NOT: { recieverId: null } },
          include: { reciever: true, sender: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!userWithPrivateMessages) {
      res.status(200).json({
        usersWithLatestPivateMessages: [],
        onlineUsers: Array.from(onlineUsers.keys()),
      });
      return;
    }

    const messages = [
      ...userWithPrivateMessages.sentMessages,
      ...userWithPrivateMessages.recievedMessages,
    ];
    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const users = new Map<
      number,
      Record<string, unknown> & { totalUnreadMessages?: number }
    >();
    const messageStatusChange: number[] = [];

    for (const msg of messages) {
      const isSender = msg.senderId === userId;
      const calculatedId = isSender ? msg.recieverId! : msg.senderId;
      if (msg.messageStatus === "sent") {
        messageStatusChange.push(msg.id);
      }

      if (!users.get(calculatedId)) {
        let user: Record<string, unknown> & { totalUnreadMessages?: number } = {
          messageId: msg.id,
          type: msg.type,
          message: msg.message,
          messageStatus: msg.messageStatus,
          createdAt: msg.createdAt,
          senderId: msg.senderId,
          recieverId: msg.recieverId,
        };
        if (isSender && msg.reciever) {
          user = { ...user, ...msg.reciever, totalUnreadMessages: 0 };
        } else if (msg.sender) {
          user = {
            ...user,
            ...msg.sender,
            totalUnreadMessages: msg.messageStatus !== "read" ? 1 : 0,
          };
        }
        users.set(calculatedId, user);
      } else if (msg.messageStatus !== "read" && !isSender) {
        const existing = users.get(calculatedId)!;
        existing.totalUnreadMessages = (existing.totalUnreadMessages ?? 0) + 1;
        users.set(calculatedId, existing);
      }
    }

    if (messageStatusChange.length > 0) {
      await prisma.messages.updateMany({
        where: { id: { in: messageStatusChange } },
        data: { messageStatus: "delivered" },
      });
    }

    res.status(200).json({
      usersWithLatestPivateMessages: Array.from(users.values()),
      onlineUsers: Array.from(onlineUsers.keys()),
    });
  } catch (err) {
    next(err);
  }
}

export async function getInitialGroupsWithMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = parseInt(String(req.params.group_id ?? ""), 10);
    const prisma = getPrismaInstance();
    const groupsWithLatestMessages = await prisma.group.findMany({
      where: {
        AND: [
          {
            OR: [
              { members: { some: { id: userId } } },
              { admins: { some: { id: userId } } },
            ],
          },
          { messages: { some: { groupId: { not: null } } } },
        ],
      },
      include: {
        messages: {
          where: { groupId: { not: null } },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });
    res.status(200).json({
      groupsWithLatestGroupMessages: groupsWithLatestMessages,
    });
  } catch (err) {
    next(err);
  }
}

export async function addMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const { chatType, from, to, message } = req.body as {
      chatType?: string;
      from?: string;
      to?: string;
      message?: string;
    };
    const getUser = to ? onlineUsers.get(String(to)) : undefined;

    if (message && from && to && chatType === "user") {
      const newMessage = await prisma.messages.create({
        data: {
          message,
          msgType: "user",
          sender: { connect: { id: parseInt(from) } },
          reciever: { connect: { id: parseInt(to) } },
          messageStatus: getUser ? "delivered" : "sent",
        },
        include: { sender: true, reciever: true },
      });
      res.status(201).send({ message: newMessage });
      return;
    }

    if (message && from && to && chatType === "group") {
      const newMessage = await prisma.messages.create({
        data: {
          message,
          group: { connect: { id: to } },
          msgType: "group",
          sender: { connect: { id: parseInt(from) } },
          messageStatus: "sent",
        },
        include: { sender: true, group: true },
      });
      res.status(201).send({ message: newMessage });
      return;
    }

    res.status(400).send("From, to and Message is required.");
  } catch (err) {
    next(err);
  }
}

/**
 * Create a message with a media URL (from media service upload). Owns message persistence.
 */
export async function addMediaMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const { chatType, from, to, url, type } = req.body as {
      chatType?: string;
      from?: number | string;
      to?: number | string;
      url?: string;
      type?: string;
    };
    if (!url || !from || !to || !chatType) {
      res.status(400).json({ ok: false, error: "from, to, chatType and url required" });
      return;
    }
    const fromId = typeof from === "number" ? from : parseInt(String(from), 10);
    const toId = String(to);
    const getUser = onlineUsers.get(toId);

    if (chatType === "user") {
      const recieverId = parseInt(toId, 10);
      if (Number.isNaN(recieverId)) {
        res.status(400).json({ ok: false, error: "Invalid to for user chat" });
        return;
      }
      const newMessage = await prisma.messages.create({
        data: {
          message: url,
          type: type || "audio",
          msgType: "user",
          sender: { connect: { id: fromId } },
          reciever: { connect: { id: recieverId } },
          messageStatus: getUser ? "delivered" : "sent",
        },
        include: { sender: true, reciever: true },
      });
      res.status(201).json({ ok: true, message: newMessage });
      return;
    }

    if (chatType === "group") {
      const newMessage = await prisma.messages.create({
        data: {
          message: url,
          type: type || "image",
          msgType: "group",
          group: { connect: { id: toId } },
          sender: { connect: { id: fromId } },
          messageStatus: "sent",
        },
        include: { sender: true, group: true },
      });
      res.status(201).json({ ok: true, message: newMessage });
      return;
    }

    res.status(400).json({ ok: false, error: "Invalid chatType" });
  } catch (err) {
    next(err);
  }
}

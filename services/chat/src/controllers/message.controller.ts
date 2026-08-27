import type { Request, Response, NextFunction } from "express";
import getPrismaInstance from "@repo/database";
import { onlineUsers } from "../state/online-users.js";
import {
  getDirectConversation,
  getOrCreateDirectConversation,
} from "../lib/conversations.js";
import {
  buildInitialDirectConversationSummaries,
  isMatchingDirectConversation,
  normalizeMessageType,
  type SupportedMessageType,
} from "../lib/direct-messages.js";
type ChatRequestKind = "user" | "group";

function getAuthenticatedUserId(req: Request): number | null {
  const raw = req.headers["x-user-id"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number.parseInt(String(value ?? ""), 10);
  return Number.isNaN(id) ? null : id;
}

function parseRequiredUserId(value: unknown): number | null {
  const id = Number.parseInt(String(value ?? ""), 10);
  return Number.isNaN(id) ? null : id;
}

async function createDirectMessage(params: {
  authenticatedUserId: number;
  fromId: number;
  toId: number;
  message: string;
  type: SupportedMessageType;
  conversationId?: string;
}) {
  const prisma = getPrismaInstance();
  const { authenticatedUserId, fromId, toId, message, type, conversationId } =
    params;

  if (fromId !== authenticatedUserId) {
    throw new Error("Forbidden");
  }

  const resolvedConversation = conversationId
    ? await prisma.conversation.findUnique({
        where: { id: conversationId },
      })
    : null;

  if (
    resolvedConversation &&
    !isMatchingDirectConversation(resolvedConversation, fromId, toId)
  ) {
    throw new Error("Conversation mismatch");
  }

  const conversation =
    resolvedConversation ??
    (await getOrCreateDirectConversation(prisma, fromId, toId));

  const isRecipientOnline = onlineUsers.get(String(toId));

  return prisma.messages.create({
    data: {
      message,
      type,
      msgType: "user",
      sender: { connect: { id: fromId } },
      receiver: { connect: { id: toId } },
      conversation: { connect: { id: conversation.id } },
      messageStatus: isRecipientOnline ? "delivered" : "sent",
    },
    include: { sender: true, receiver: true, conversation: true },
  });
}

export async function getOrCreateConversation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const fromId = parseRequiredUserId(req.body?.from);
    const toId = parseRequiredUserId(req.body?.to);

    if (fromId === null) {
      res.status(400).json({ ok: false, error: "Invalid from user id" });
      return;
    }
    if (toId === null) {
      res.status(400).json({ ok: false, error: "Invalid to user id" });
      return;
    }
    if (fromId !== authenticatedUserId) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }

    const prisma = getPrismaInstance();
    const conversation = await getOrCreateDirectConversation(prisma, fromId, toId);

    res.status(200).json({ ok: true, conversation });
  } catch (error) {
    next(error);
  }
}

export async function getMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const fromId = parseRequiredUserId(req.params.from);
    const to = String(req.params.to ?? "");
    const chatType = String(req.params.chatType ?? "") as ChatRequestKind;

    if (fromId === null) {
      res.status(400).json({ ok: false, error: "Invalid from user id" });
      return;
    }
    if (fromId !== authenticatedUserId) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }

    if (chatType === "user") {
      const toId = parseRequiredUserId(to);
      if (toId === null) {
        res.status(400).json({ ok: false, error: "Invalid to user id" });
        return;
      }

      const conversation = await getDirectConversation(prisma, fromId, toId);
      if (!conversation) {
        res.status(200).json({ messages: [] });
        return;
      }

      const messages = await prisma.messages.findMany({
        where: { conversationId: conversation.id },
        include: { sender: true, receiver: true, conversation: true },
        orderBy: { id: "asc" },
      });

      const unreadIds = messages
        .filter(
          (message: {
            messageStatus: string;
            senderId: number;
            receiverId: number | null;
          }) =>
            message.messageStatus !== "read" &&
            message.senderId === toId &&
            message.receiverId === fromId
        )
        .map((message: { id: number }) => message.id);

      if (unreadIds.length > 0) {
        await prisma.messages.updateMany({
          where: { id: { in: unreadIds } },
          data: { messageStatus: "read" },
        });

        messages.forEach((message: (typeof messages)[number]) => {
          if (unreadIds.includes(message.id)) {
            message.messageStatus = "read";
          }
        });
      }

      res.status(200).json({ messages });
      return;
    }

    if (chatType === "group") {
      const messages = await prisma.messages.findMany({
        where: { groupId: to },
        include: { sender: true, group: true },
        orderBy: { id: "asc" },
      });
      res.status(200).json({ messages });
      return;
    }

    res.status(400).json({ ok: false, error: "Invalid chatType" });
  } catch (error) {
    next(error);
  }
}

export async function getInitialUsersWithMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = parseRequiredUserId(req.params.from);
    const authenticatedUserId = getAuthenticatedUserId(req);

    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
    if (userId === null) {
      res.status(400).json({ ok: false, error: "Invalid user id" });
      return;
    }
    if (authenticatedUserId !== userId) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }

    const prisma = getPrismaInstance();
    const directMessages = await prisma.messages.findMany({
      where: {
        receiverId: { not: null },
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { include: { userProfile: true } },
        receiver: { include: { userProfile: true } },
        conversation: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const { usersWithLatestPrivateMessages, deliveredMessageIds } =
      buildInitialDirectConversationSummaries(directMessages, userId);

    if (deliveredMessageIds.length > 0) {
      await prisma.messages.updateMany({
        where: { id: { in: deliveredMessageIds } },
        data: { messageStatus: "delivered" },
      });
    }

    res.status(200).json({
      usersWithLatestPrivateMessages,
      onlineUsers: Array.from(onlineUsers.keys()).map((id) => Number(id)),
    });
  } catch (error) {
    next(error);
  }
}

export async function getInitialGroupsWithMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = parseRequiredUserId(req.params.userId);
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
    if (userId === null) {
      res.status(400).json({ ok: false, error: "Invalid user id" });
      return;
    }
    if (authenticatedUserId !== userId) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }

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
  } catch (error) {
    next(error);
  }
}

export async function addMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const { chatType, from, to, message } = req.body as {
      chatType?: ChatRequestKind;
      from?: string | number;
      to?: string | number;
      message?: string;
    };

    const fromId = parseRequiredUserId(from);
    if (fromId === null) {
      res.status(400).json({ ok: false, error: "Invalid from user id" });
      return;
    }
    if (fromId !== authenticatedUserId) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }

    const prisma = getPrismaInstance();

    if (message && to && chatType === "user") {
      const toId = parseRequiredUserId(to);
      if (toId === null) {
        res.status(400).json({ ok: false, error: "Invalid to user id" });
        return;
      }

      const newMessage = await createDirectMessage({
        authenticatedUserId,
        fromId,
        toId,
        message,
        type: "text",
      });
      res.status(201).send({ message: newMessage });
      return;
    }

    if (message && to && chatType === "group") {
      const newMessage = await prisma.messages.create({
        data: {
          message,
          type: "text",
          group: { connect: { id: String(to) } },
          msgType: "group",
          sender: { connect: { id: fromId } },
          messageStatus: "sent",
        },
        include: { sender: true, group: true },
      });
      res.status(201).send({ message: newMessage });
      return;
    }

    res.status(400).json({ ok: false, error: "from, to and message are required" });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }
    if (error instanceof Error && error.message === "Conversation mismatch") {
      res.status(400).json({ ok: false, error: "Invalid direct conversation" });
      return;
    }
    next(error);
  }
}

export async function addMediaMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const prisma = getPrismaInstance();
    const authenticatedUserId = getAuthenticatedUserId(req);
    if (authenticatedUserId === null) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const { chatType, from, to, url, type, conversationId } = req.body as {
      chatType?: ChatRequestKind;
      from?: number | string;
      to?: number | string;
      url?: string;
      type?: string;
      conversationId?: string;
    };
    if (!url || !from || !to || !chatType) {
      res.status(400).json({ ok: false, error: "from, to, chatType and url required" });
      return;
    }

    const fromId = parseRequiredUserId(from);
    if (fromId === null) {
      res.status(400).json({ ok: false, error: "Invalid from user id" });
      return;
    }
    if (fromId !== authenticatedUserId) {
      res.status(403).json({ ok: false, error: "Forbidden" });
      return;
    }

    if (chatType === "user") {
      const receiverId = parseRequiredUserId(to);
      if (receiverId === null) {
        res.status(400).json({ ok: false, error: "Invalid to for user chat" });
        return;
      }

      const newMessage = await createDirectMessage({
        authenticatedUserId,
        fromId,
        toId: receiverId,
        message: url,
        type: normalizeMessageType(type, "audio"),
        conversationId,
      });
      res.status(201).json({ ok: true, message: newMessage });
      return;
    }

    if (chatType === "group") {
      const newMessage = await prisma.messages.create({
        data: {
          message: url,
          type: normalizeMessageType(type, "image"),
          msgType: "group",
          group: { connect: { id: String(to) } },
          sender: { connect: { id: fromId } },
          messageStatus: "sent",
        },
        include: { sender: true, group: true },
      });
      res.status(201).json({ ok: true, message: newMessage });
      return;
    }

    res.status(400).json({ ok: false, error: "Invalid chatType" });
  } catch (error) {
    if (error instanceof Error && error.message === "Conversation mismatch") {
      res.status(400).json({ ok: false, error: "Invalid direct conversation" });
      return;
    }
    next(error);
  }
}

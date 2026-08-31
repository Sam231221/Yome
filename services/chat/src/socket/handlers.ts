import type { Server, Socket } from "socket.io";
import getPrismaInstance from "@repo/database";
import {
  addOnlineUserSocket,
  getOnlineUserIds,
  getOnlineUserSockets,
  removeOnlineUserSocket,
  removeSocketFromOnlineUsers,
} from "../state/online-users.js";

type SocketChatMessage = {
  id: number;
  senderId: number;
  receiverId: number | null;
  conversationId?: string | null;
  message: string;
  type: "text" | "image" | "audio";
  msgType?: "user" | "group";
  messageStatus: "sent" | "delivered" | "read";
  createdAt: string | Date;
  groupId?: string | null;
};

const parseSocketUserId = (value: unknown) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export function attachSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    const emitOnlineUsers = () => {
      io.emit("online-users", {
        onlineUsers: getOnlineUserIds(),
      });
    };

    socket.on("add-user", () => {
      const userId = socket.data.userId as string | undefined;
      if (!userId) {
        socket.disconnect(true);
        return;
      }
      socket.join(userId);
      addOnlineUserSocket(userId, socket.id);
      emitOnlineUsers();
    });

    socket.on("join room", async (room: string) => {
      const authedUserId = parseSocketUserId(socket.data.userId);
      if (authedUserId === null) return;

      const groupId = room.startsWith("room-") ? room.slice("room-".length) : room;
      const prisma = getPrismaInstance();
      const groupCount = await prisma.group.count({
        where: {
          id: groupId,
          OR: [
            { members: { some: { id: authedUserId } } },
            { admins: { some: { id: authedUserId } } },
          ],
        },
      });

      if (groupCount > 0) {
        socket.join(room);
      }
    });

    socket.on(
      "send-msg",
      async (data: {
        from: number;
        to: number | string;
        chatType: "user" | "group";
        message: SocketChatMessage;
        room?: string;
      }) => {
        const authedUserId = parseSocketUserId(socket.data.userId);
        if (authedUserId === null) return;
        if (data.from !== authedUserId) {
          data.from = authedUserId;
        }
        if (!data.message?.id) return;

        const prisma = getPrismaInstance();

        if (data.chatType === "user") {
          const toUserId = parseSocketUserId(data.to);
          if (toUserId === null) return;

          const message = await prisma.messages.findFirst({
            where: {
              id: data.message.id,
              msgType: "user",
              senderId: authedUserId,
              receiverId: toUserId,
            },
            include: { sender: true, receiver: true, conversation: true },
          });
          if (!message) return;

          for (const sendUserSocket of getOnlineUserSockets(toUserId)) {
            socket.to(sendUserSocket).emit("privateMessageReceived", {
              from: data.from,
              msgType: "user",
              message,
            });
          }
          return;
        }

        const group = await prisma.group.findUnique({
          where: { id: String(data.to) },
          include: {
            members: true,
            admins: true,
            messages: {
              where: {
                id: data.message.id,
                senderId: authedUserId,
                msgType: "group",
              },
              include: { sender: true, group: true },
              take: 1,
            },
          },
        });
        if (!group) return;
        const recipients = new Map(
          [...group.members, ...group.admins].map((user) => [user.id, user])
        );
        if (!recipients.has(data.from)) return;
        const message = group.messages[0];
        if (!message) return;

        for (const user of recipients.values()) {
          if (user.id === data.from) continue;
          for (const memberSocketId of getOnlineUserSockets(user.id)) {
            socket.to(memberSocketId).emit("msg-receive", {
              from: data.from,
              message,
              msgType: "group",
              room: data.room,
              groupId: String(data.to),
            });
          }
        }
      }
    );

    socket.on("mark-read", (payload: { id: number; receiverId?: number }) => {
      const { id, receiverId } = payload;
      const authedUserId = parseSocketUserId(socket.data.userId);
      if (authedUserId === null || receiverId !== authedUserId) return;
      if (id === authedUserId) return;

      for (const sendUserSocket of getOnlineUserSockets(id)) {
        const data = {
          id,
          receiverId,
        };
        socket.to(sendUserSocket).emit("mark-read-receive", data);
      }
    });

    socket.on("signout", (id: string | number) => {
      const normalizedUserId = String(id ?? socket.data.userId ?? "");
      if (!normalizedUserId) return;
      removeOnlineUserSocket(normalizedUserId, socket.id);
      socket.leave(normalizedUserId);
      emitOnlineUsers();
    });

    socket.on("disconnect", () => {
      removeSocketFromOnlineUsers(socket.id);
      emitOnlineUsers();
    });
  });
}

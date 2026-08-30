import type { Server, Socket } from "socket.io";
import getPrismaInstance from "@repo/database";
import { onlineUsers } from "../state/online-users.js";

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
        onlineUsers: Array.from(onlineUsers.keys()).map((id) => Number(id)),
      });
    };

    const removeUserBySocketId = (socketId: string) => {
      for (const [userId, mappedSocketId] of onlineUsers.entries()) {
        if (mappedSocketId === socketId) {
          onlineUsers.delete(userId);
          break;
        }
      }
    };

    socket.on("add-user", () => {
      const userId = socket.data.userId as string | undefined;
      if (!userId) {
        socket.disconnect(true);
        return;
      }
      socket.join(userId);
      onlineUsers.set(userId, socket.id);
      emitOnlineUsers();
    });

    socket.on("join room", (room: string) => {
      socket.join(room);
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

        if (data.chatType === "user") {
          const sendUserSocket = onlineUsers.get(String(data.to));
          if (sendUserSocket) {
            socket.to(sendUserSocket).emit("privateMessageReceived", {
              from: data.from,
              msgType: "user",
              message: data.message,
            });
          }
          return;
        }

        const prisma = getPrismaInstance();
        const group = await prisma.group.findUnique({
          where: { id: String(data.to) },
          include: { members: true, admins: true },
        });
        if (!group) return;
        const recipients = new Map(
          [...group.members, ...group.admins].map((user) => [user.id, user])
        );
        if (!recipients.has(data.from)) return;

        for (const user of recipients.values()) {
          if (user.id === data.from) continue;
          const memberSocketId = onlineUsers.get(String(user.id));
          if (memberSocketId) {
            socket.to(memberSocketId).emit("msg-receive", {
              from: data.from,
              message: data.message,
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
      const sendUserSocket = onlineUsers.get(String(id));
      if (sendUserSocket) {
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
      onlineUsers.delete(normalizedUserId);
      socket.leave(normalizedUserId);
      emitOnlineUsers();
    });

    socket.on("disconnect", () => {
      removeUserBySocketId(socket.id);
      emitOnlineUsers();
    });

    // Voice call events
    socket.on("outgoing-voice-call", (data: { from: string; to: string; roomId: string; callType: string }) => {
      const sendUserSocket = onlineUsers.get(data.to);
      if (sendUserSocket) {
        socket.to(sendUserSocket).emit("incoming-voice-call", {
          from: data.from,
          roomId: data.roomId,
          callType: data.callType,
        });
      } else {
        const senderSocket = onlineUsers.get(data.from);
        if (senderSocket) {
          socket.to(senderSocket).emit("voice-call-offline");
        }
      }
    });

    socket.on("reject-voice-call", (data: { from: string }) => {
      const sendUserSocket = onlineUsers.get(data.from);
      if (sendUserSocket) {
        socket.to(sendUserSocket).emit("voice-call-rejected");
      }
    });

    // Video call events
    socket.on("outgoing-video-call", (data: { from: string; to: string; roomId: string; callType: string }) => {
      const sendUserSocket = onlineUsers.get(data.to);
      if (sendUserSocket) {
        socket.to(sendUserSocket).emit("incoming-video-call", {
          from: data.from,
          roomId: data.roomId,
          callType: data.callType,
        });
      } else {
        const senderSocket = onlineUsers.get(data.from);
        if (senderSocket) {
          socket.to(senderSocket).emit("video-call-offline");
        }
      }
    });

    socket.on("accept-incoming-call", ({ id }: { id: string }) => {
      const sendUserSocket = onlineUsers.get(id);
      if (sendUserSocket) {
        socket.to(sendUserSocket).emit("accept-call");
      }
    });

    socket.on("reject-video-call", (data: { from: string }) => {
      const sendUserSocket = onlineUsers.get(data.from);
      if (sendUserSocket) {
        socket.to(sendUserSocket).emit("video-call-rejected");
      }
    });
  });
}

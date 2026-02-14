import type { Server, Socket } from "socket.io";
import getPrismaInstance from "@repo/database";
import { onlineUsers } from "../state/online-users.js";

export function attachSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    socket.on("add-user", (userId: string) => {
      socket.join(userId);
      onlineUsers.set(userId, socket.id);
      socket.broadcast.emit("online-users", {
        onlineUsers: Array.from(onlineUsers.keys()),
      });
    });

    socket.on("join room", (room: string) => {
      socket.join(room);
    });

    socket.on("send-msg", async (data: { from: string; to: string; chatType: string; message: string; room?: string }) => {
      const sendUserSocket = onlineUsers.get(data.to);
      if (data.chatType === "user" && sendUserSocket) {
        socket.to(sendUserSocket).emit("privateMessageReceived", {
          from: data.from,
          msgType: "user",
          message: data.message,
        });
      }

      if (data.chatType === "group") {
        const prisma = getPrismaInstance();
        const group = await prisma.group.findUnique({
          where: { id: data.to },
          include: { members: true },
        });
        if (group) {
          for (const user of group.members) {
            if (user.id === parseInt(data.from)) continue;
            const memberSocketId = onlineUsers.get(String(user.id));
            if (memberSocketId) {
              const payload = {
                from: data.from,
                message: data.message,
                msgType: "group",
                room: data.room,
                groupId: data.to,
              };
              socket.to(memberSocketId).emit("msg-receive", payload);
              socket.to(memberSocketId).emit("msg-recieve", payload); // legacy
            }
          }
        }
      }
    });

    socket.on("mark-read", (payload: { id: string; receiverId?: string; recieverId?: string }) => {
      const { id, receiverId, recieverId } = payload;
      const sendUserSocket = onlineUsers.get(id);
      if (sendUserSocket) {
        const data = { id, receiverId: receiverId ?? recieverId };
        socket.to(sendUserSocket).emit("mark-read-receive", data);
        socket.to(sendUserSocket).emit("mark-read-recieve", data); // legacy
      }
    });

    socket.on("signout", (id: string) => {
      onlineUsers.delete(id);
      socket.leave(id);
      socket.broadcast.emit("online-users", {
        onlineUsers: Array.from(onlineUsers.keys()),
      });
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

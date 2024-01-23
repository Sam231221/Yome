import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import getPrismaInstance from "./utils/PrismaClient.js";
import AuthRoutes from "./routes/AuthRoutes.js";
import MessageRoutes from "./routes/MessageRoutes.js";

import DbRoutes from "./routes/DbRoutes.js";
import EIRoutes from "./routes/EIRoutes.js";
import { Server } from "socket.io";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

//Note:Routes must be defined below express.json()
app.use("/uploads/recordings", express.static("uploads/recordings"));
app.use("/uploads/images/", express.static("uploads/images"));

app.use("/api/auth/", AuthRoutes);
app.use("/api/messages", MessageRoutes);

app.use("/api/ei", EIRoutes);
app.use("/api/db", DbRoutes);
const server = app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_CLIENT_PORT,
    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;

  socket.on("add-user", (userId) => {
    //imp
    socket.join(userId);
    onlineUsers.set(userId, socket.id);

    socket.broadcast.emit("online-users", {
      onlineUsers: Array.from(onlineUsers.keys()),
    });
  });

  socket.on("join room", (room, userid) => {
    socket.join(room);
  });
  socket.on("send-msg", async (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (data.chatType === "user") {
      if (sendUserSocket) {
        socket.to(sendUserSocket).emit("privateMessageReceived", {
          from: data.from,
          msgType: "user",
          message: data.message,
        });
      }
    }
    if (data.chatType === "group") {
      const prisma = getPrismaInstance();
      const group = await prisma.group.findUnique({
        where: { id: data.to },
        include: { members: true },
      });
      group.members.forEach((user) => {
        if (user.id == data.from) return;
        socket.to(user.id).emit("msg-recieve", {
          from: data.from,
          message: data.message,
          msgType: "group",
          room: data.room,
          groupId: data.to,
        });
      });
    }
  });

  socket.on("mark-read", ({ id, recieverId }) => {
    const sendUserSocket = onlineUsers.get(id);
    //if the sender is online, mark read recieve
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("mark-read-recieve", { id, recieverId });
    }
  });

  socket.on("signout", (id) => {
    onlineUsers.delete(id);
    socket.leave(id);
    socket.broadcast.emit("online-users", {
      onlineUsers: Array.from(onlineUsers.keys()),
    });
  });

  socket.on("outgoing-voice-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("incoming-voice-call", {
        from: data.from,
        roomId: data.roomId,
        callType: data.callType,
      });
    } else {
      const senderSocket = onlineUsers.get(data.from);
      socket.to(senderSocket).emit("voice-call-offline");
    }
  });

  socket.on("reject-voice-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.from);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("voice-call-rejected");
    }
  });

  socket.on("outgoing-video-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("incoming-video-call", {
        from: data.from,
        roomId: data.roomId,
        callType: data.callType,
      });
    } else {
      const senderSocket = onlineUsers.get(data.from);
      socket.to(senderSocket).emit("video-call-offline");
    }
  });

  socket.on("accept-incoming-call", ({ id }) => {
    const sendUserSocket = onlineUsers.get(id);
    socket.to(sendUserSocket).emit("accept-call");
  });

  socket.on("reject-video-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.from);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("video-call-rejected");
    }
  });
});

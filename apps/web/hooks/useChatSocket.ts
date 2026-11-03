"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { CHAT_SOCKET_URL } from "@/utils/ApiRoutes";
import type {
  ChatSocketRef,
  GroupMessageEvent,
  MarkReadEvent,
  OnlineUsersEvent,
  PrivateMessageEvent,
  UserId,
} from "@/types/chat";

type UseChatSocketParams = {
  userId?: UserId;
  onSocketReady?: (socketRef: ChatSocketRef) => void;
  onPrivateMessageReceived?: (payload: PrivateMessageEvent) => void;
  onGroupMessageReceived?: (payload: GroupMessageEvent) => void;
  onOnlineUsers?: (payload: OnlineUsersEvent) => void;
  onMarkReadReceived?: (payload: MarkReadEvent) => void;
};

const noop = () => {};

export const useChatSocket = ({
  userId,
  onSocketReady,
  onPrivateMessageReceived,
  onGroupMessageReceived,
  onOnlineUsers,
  onMarkReadReceived,
}: UseChatSocketParams) => {
  const socketRef = useRef<Socket | null>(null);
  const [activeSocket, setActiveSocket] = useState<Socket | null>(null);
  const onSocketReadyRef = useRef(onSocketReady);
  const onPrivateMessageReceivedRef = useRef(onPrivateMessageReceived);
  const onGroupMessageReceivedRef = useRef(onGroupMessageReceived);
  const onOnlineUsersRef = useRef(onOnlineUsers);
  const onMarkReadReceivedRef = useRef(onMarkReadReceived);

  useEffect(() => {
    onSocketReadyRef.current = onSocketReady;
    onPrivateMessageReceivedRef.current = onPrivateMessageReceived;
    onGroupMessageReceivedRef.current = onGroupMessageReceived;
    onOnlineUsersRef.current = onOnlineUsers;
    onMarkReadReceivedRef.current = onMarkReadReceived;
  }, [
    onSocketReady,
    onPrivateMessageReceived,
    onGroupMessageReceived,
    onOnlineUsers,
    onMarkReadReceived,
  ]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const fetchSocketToken = async () => {
      const res = await fetch("/api/auth/socket-token", { credentials: "include" });
      if (!res.ok) throw new Error(`socket-token responded ${res.status}`);
      const data = (await res.json()) as { token?: string };
      if (!data.token) throw new Error("socket-token response had no token");
      return data.token;
    };

    (async () => {
      try {
        const initialToken = await fetchSocketToken();
        if (cancelled || socketRef.current) return;

        // `auth` as a function is re-run on every (re)connect attempt, so a reconnect after
        // the 5-minute socket token expired still handshakes with a fresh one.
        const socket = io(CHAT_SOCKET_URL, {
          auth: (cb) => {
            fetchSocketToken()
              .then((token) => cb({ token }))
              .catch(() => cb({ token: initialToken }));
          },
        });
        socketRef.current = socket;
        setActiveSocket(socket);
        onSocketReadyRef.current?.(socketRef);

        // A reconnect gets a new socket id and the server has dropped this user's presence
        // on disconnect, so register again on every connect, not just the first.
        socket.on("connect", () => {
          socket.emit("add-user", String(userId));
        });
        socket.on("connect_error", (error) => {
          console.warn("[chat] socket connect_error:", error.message);
          // Socket.IO does not retry after a middleware rejection (e.g. an expired
          // token), so retry manually.
          if (!socket.active) {
            setTimeout(() => {
              if (socketRef.current === socket) socket.connect();
            }, 2000);
          }
        });
      } catch (error) {
        console.warn("[chat] could not start realtime socket:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!activeSocket) return;

    const socket = activeSocket;
    const privateMessageHandler = (payload: PrivateMessageEvent) =>
      (onPrivateMessageReceivedRef.current || noop)(payload);
    const groupMessageHandler = (payload: GroupMessageEvent) =>
      (onGroupMessageReceivedRef.current || noop)(payload);
    const onlineUsersHandler = (payload: OnlineUsersEvent) =>
      (onOnlineUsersRef.current || noop)(payload);
    const markReadHandler = (payload: MarkReadEvent) =>
      (onMarkReadReceivedRef.current || noop)(payload);

    socket.off("privateMessageReceived", privateMessageHandler);
    socket.off("msg-receive", groupMessageHandler);
    socket.off("online-users", onlineUsersHandler);
    socket.off("mark-read-receive", markReadHandler);

    socket.on("privateMessageReceived", privateMessageHandler);
    socket.on("msg-receive", groupMessageHandler);
    socket.on("online-users", onlineUsersHandler);
    socket.on("mark-read-receive", markReadHandler);

    return () => {
      socket.off("privateMessageReceived", privateMessageHandler);
      socket.off("msg-receive", groupMessageHandler);
      socket.off("online-users", onlineUsersHandler);
      socket.off("mark-read-receive", markReadHandler);
    };
  }, [activeSocket]);

  useEffect(() => {
    return () => {
      if (!socketRef.current) return;
      if (userId) {
        socketRef.current.emit("signout", String(userId));
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      setActiveSocket(null);
    };
  }, [userId]);

  return socketRef;
};

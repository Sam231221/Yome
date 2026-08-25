"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { CHAT_SOCKET_URL } from "@/utils/ApiRoutes";
import type {
  ChatSocketRef,
  GroupMessageEvent,
  IncomingCallEvent,
  MarkReadEvent,
  NumericId,
  OnlineUsersEvent,
  PrivateMessageEvent,
} from "@/types/chat";

type UseChatSocketParams = {
  userId?: NumericId;
  onSocketReady?: (socketRef: ChatSocketRef) => void;
  onPrivateMessageReceived?: (payload: PrivateMessageEvent) => void;
  onGroupMessageReceived?: (payload: GroupMessageEvent) => void;
  onOnlineUsers?: (payload: OnlineUsersEvent) => void;
  onMarkReadReceived?: (payload: MarkReadEvent) => void;
  onIncomingVoiceCall?: (payload: IncomingCallEvent) => void;
  onVoiceCallRejected?: () => void;
  onIncomingVideoCall?: (payload: IncomingCallEvent) => void;
  onVideoCallRejected?: () => void;
};

const noop = () => {};

export const useChatSocket = ({
  userId,
  onSocketReady,
  onPrivateMessageReceived,
  onGroupMessageReceived,
  onOnlineUsers,
  onMarkReadReceived,
  onIncomingVoiceCall,
  onVoiceCallRejected,
  onIncomingVideoCall,
  onVideoCallRejected,
}: UseChatSocketParams) => {
  const socketRef = useRef<Socket | null>(null);
  const [activeSocket, setActiveSocket] = useState<Socket | null>(null);
  const onSocketReadyRef = useRef(onSocketReady);
  const onPrivateMessageReceivedRef = useRef(onPrivateMessageReceived);
  const onGroupMessageReceivedRef = useRef(onGroupMessageReceived);
  const onOnlineUsersRef = useRef(onOnlineUsers);
  const onMarkReadReceivedRef = useRef(onMarkReadReceived);
  const onIncomingVoiceCallRef = useRef(onIncomingVoiceCall);
  const onVoiceCallRejectedRef = useRef(onVoiceCallRejected);
  const onIncomingVideoCallRef = useRef(onIncomingVideoCall);
  const onVideoCallRejectedRef = useRef(onVideoCallRejected);

  useEffect(() => {
    onSocketReadyRef.current = onSocketReady;
    onPrivateMessageReceivedRef.current = onPrivateMessageReceived;
    onGroupMessageReceivedRef.current = onGroupMessageReceived;
    onOnlineUsersRef.current = onOnlineUsers;
    onMarkReadReceivedRef.current = onMarkReadReceived;
    onIncomingVoiceCallRef.current = onIncomingVoiceCall;
    onVoiceCallRejectedRef.current = onVoiceCallRejected;
    onIncomingVideoCallRef.current = onIncomingVideoCall;
    onVideoCallRejectedRef.current = onVideoCallRejected;
  }, [
    onSocketReady,
    onPrivateMessageReceived,
    onGroupMessageReceived,
    onOnlineUsers,
    onMarkReadReceived,
    onIncomingVoiceCall,
    onVoiceCallRejected,
    onIncomingVideoCall,
    onVideoCallRejected,
  ]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/socket-token", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { token?: string };
        if (!data.token || cancelled) return;
        if (!socketRef.current) {
          socketRef.current = io(CHAT_SOCKET_URL, { auth: { token: data.token } });
          setActiveSocket(socketRef.current);
          onSocketReadyRef.current?.(socketRef);
        }
        socketRef.current.emit("add-user", String(userId));
      } catch {
        // Keep socket unauthenticated-off when token fetch fails.
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
    const incomingVoiceCallHandler = (payload: IncomingCallEvent) =>
      (onIncomingVoiceCallRef.current || noop)(payload);
    const voiceCallRejectedHandler = () =>
      (onVoiceCallRejectedRef.current || noop)();
    const incomingVideoCallHandler = (payload: IncomingCallEvent) =>
      (onIncomingVideoCallRef.current || noop)(payload);
    const videoCallRejectedHandler = () =>
      (onVideoCallRejectedRef.current || noop)();

    socket.off("privateMessageReceived", privateMessageHandler);
    socket.off("msg-receive", groupMessageHandler);
    socket.off("online-users", onlineUsersHandler);
    socket.off("mark-read-receive", markReadHandler);
    socket.off("incoming-voice-call", incomingVoiceCallHandler);
    socket.off("voice-call-rejected", voiceCallRejectedHandler);
    socket.off("incoming-video-call", incomingVideoCallHandler);
    socket.off("video-call-rejected", videoCallRejectedHandler);

    socket.on("privateMessageReceived", privateMessageHandler);
    socket.on("msg-receive", groupMessageHandler);
    socket.on("online-users", onlineUsersHandler);
    socket.on("mark-read-receive", markReadHandler);
    socket.on("incoming-voice-call", incomingVoiceCallHandler);
    socket.on("voice-call-rejected", voiceCallRejectedHandler);
    socket.on("incoming-video-call", incomingVideoCallHandler);
    socket.on("video-call-rejected", videoCallRejectedHandler);

    return () => {
      socket.off("privateMessageReceived", privateMessageHandler);
      socket.off("msg-receive", groupMessageHandler);
      socket.off("online-users", onlineUsersHandler);
      socket.off("mark-read-receive", markReadHandler);
      socket.off("incoming-voice-call", incomingVoiceCallHandler);
      socket.off("voice-call-rejected", voiceCallRejectedHandler);
      socket.off("incoming-video-call", incomingVideoCallHandler);
      socket.off("video-call-rejected", videoCallRejectedHandler);
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

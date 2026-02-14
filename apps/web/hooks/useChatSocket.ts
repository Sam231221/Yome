"use client";

import { MutableRefObject, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { HOST } from "@/utils/ApiRoutes";

type SocketPayload = any;

type UseChatSocketParams = {
  userId?: number;
  onSocketReady?: (socketRef: MutableRefObject<Socket | null>) => void;
  onPrivateMessageReceived?: (payload: SocketPayload) => void;
  onGroupMessageReceived?: (payload: SocketPayload) => void;
  onOnlineUsers?: (payload: SocketPayload) => void;
  onMarkReadReceived?: (payload: SocketPayload) => void;
  onIncomingVoiceCall?: (payload: SocketPayload) => void;
  onVoiceCallRejected?: () => void;
  onIncomingVideoCall?: (payload: SocketPayload) => void;
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

    if (!socketRef.current) {
      socketRef.current = io(HOST);
      onSocketReadyRef.current?.(socketRef);
    }

    socketRef.current.emit("add-user", userId);
  }, [userId]);

  useEffect(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;
    const privateMessageHandler = (payload: SocketPayload) =>
      (onPrivateMessageReceivedRef.current || noop)(payload);
    const groupMessageHandler = (payload: SocketPayload) =>
      (onGroupMessageReceivedRef.current || noop)(payload);
    const onlineUsersHandler = (payload: SocketPayload) =>
      (onOnlineUsersRef.current || noop)(payload);
    const markReadHandler = (payload: SocketPayload) =>
      (onMarkReadReceivedRef.current || noop)(payload);
    const incomingVoiceCallHandler = (payload: SocketPayload) =>
      (onIncomingVoiceCallRef.current || noop)(payload);
    const voiceCallRejectedHandler = () =>
      (onVoiceCallRejectedRef.current || noop)();
    const incomingVideoCallHandler = (payload: SocketPayload) =>
      (onIncomingVideoCallRef.current || noop)(payload);
    const videoCallRejectedHandler = () =>
      (onVideoCallRejectedRef.current || noop)();

    socket.off("privateMessageReceived", privateMessageHandler);
    socket.off("msg-recieve", groupMessageHandler);
    socket.off("online-users", onlineUsersHandler);
    socket.off("mark-read-recieve", markReadHandler);
    socket.off("incoming-voice-call", incomingVoiceCallHandler);
    socket.off("voice-call-rejected", voiceCallRejectedHandler);
    socket.off("incoming-video-call", incomingVideoCallHandler);
    socket.off("video-call-rejected", videoCallRejectedHandler);

    socket.on("privateMessageReceived", privateMessageHandler);
    socket.on("msg-recieve", groupMessageHandler);
    socket.on("online-users", onlineUsersHandler);
    socket.on("mark-read-recieve", markReadHandler);
    socket.on("incoming-voice-call", incomingVoiceCallHandler);
    socket.on("voice-call-rejected", voiceCallRejectedHandler);
    socket.on("incoming-video-call", incomingVideoCallHandler);
    socket.on("video-call-rejected", videoCallRejectedHandler);

    return () => {
      socket.off("privateMessageReceived", privateMessageHandler);
      socket.off("msg-recieve", groupMessageHandler);
      socket.off("online-users", onlineUsersHandler);
      socket.off("mark-read-recieve", markReadHandler);
      socket.off("incoming-voice-call", incomingVoiceCallHandler);
      socket.off("voice-call-rejected", voiceCallRejectedHandler);
      socket.off("incoming-video-call", incomingVideoCallHandler);
      socket.off("video-call-rejected", videoCallRejectedHandler);
    };
  }, [userId]);

  useEffect(() => {
    return () => {
      if (!socketRef.current) return;
      if (userId) {
        socketRef.current.emit("signout", userId);
      }
      socketRef.current.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  return socketRef;
};

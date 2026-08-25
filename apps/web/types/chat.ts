import type { MutableRefObject } from "react";
import type { Socket } from "socket.io-client";
import type { AppUserInfo } from "@/lib/auth/userInfo";

export type NumericId = number | string;
export type ChatKind = "user" | "group";
export type CallDirection = "out-going" | "in-coming";
export type CallMode = "audio" | "video";

export type ChatSocketRef = MutableRefObject<Socket | null>;

export type ChatIdentity = {
  id: NumericId;
  name?: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  email?: string;
  about?: string;
  profilePicture?: string;
  identifier?: string;
  userProfile?: {
    bio?: string;
    address?: string;
  };
};

export type ChatMessageParty = {
  id: NumericId;
  name?: string;
  profilePicture?: string;
};

export type ChatGroupRef = {
  id: string;
  name: string;
  thumbnail?: string;
};

export type ChatMessage = {
  id: number;
  senderId: number;
  recieverId: number | null;
  message: string;
  type: string;
  msgType?: string;
  messageStatus: string;
  createdAt: string | Date;
  groupId?: string | null;
  sender?: ChatMessageParty;
  reciever?: ChatMessageParty;
  group?: ChatGroupRef;
};

export type ChatListItem = ChatIdentity & {
  type?: string;
  thumbnail?: string;
  message?: string;
  messageId?: NumericId;
  messageStatus?: string;
  recieverId?: NumericId | null;
  senderId?: NumericId;
  createdAt?: string | Date;
  totalUnreadMessages?: number;
  online?: boolean;
};

export type ActiveCall = {
  id: NumericId;
  name?: string;
  profilePicture?: string;
  type?: CallDirection;
  callType?: CallMode;
  roomId?: number;
};

export type OnlineUsersEvent = {
  onlineUsers: NumericId[];
};

export type PrivateMessageEvent = {
  message: ChatMessage;
  from?: NumericId;
};

export type GroupMessageEvent = {
  message: ChatMessage;
  groupId?: NumericId;
};

export type MarkReadEvent = {
  id: NumericId;
  recieverId?: NumericId;
};

export type IncomingCallEvent = {
  from: ChatIdentity & { id: NumericId; name?: string };
  roomId: number;
  callType: CallMode;
};

export type ChatStateUser = AppUserInfo;

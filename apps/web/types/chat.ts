import type { MutableRefObject } from "react";
import type { Socket } from "socket.io-client";
import type { AppUserInfo } from "@/lib/auth/userInfo";

export type UserId = number;
export type MessageId = number;
export type GroupId = string;
export type ConversationId = string;
export type ChatIdentityId = UserId | GroupId;
export type NumericId = ChatIdentityId;
export type ChatKind = "user" | "group";
export type MessageKind = "text" | "image" | "audio";
export type CallDirection = "out-going" | "in-coming";
export type CallMode = "audio" | "video";

export type ChatSocketRef = MutableRefObject<Socket | null>;

export type ChatIdentity = {
  id: ChatIdentityId;
  name?: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  email?: string;
  about?: string;
  profilePicture?: string;
  identifier?: string;
  type?: string;
  conversationId?: ConversationId | null;
  userProfile?: {
    bio?: string;
    address?: string;
  };
};

export type ChatMessageParty = {
  id: UserId;
  name?: string;
  profilePicture?: string;
};

export type ChatGroupRef = {
  id: GroupId;
  name: string;
  thumbnail?: string;
};

export type ChatConversationRef = {
  id: ConversationId;
};

export type ChatMessage = {
  id: MessageId;
  senderId: UserId;
  receiverId: UserId | null;
  conversationId?: ConversationId | null;
  message: string;
  type: MessageKind;
  msgType?: ChatKind;
  messageStatus: "sent" | "delivered" | "read";
  createdAt: string | Date;
  groupId?: GroupId | null;
  sender?: ChatMessageParty;
  receiver?: ChatMessageParty;
  group?: ChatGroupRef;
  conversation?: ChatConversationRef;
};

export type ChatListItem = ChatIdentity & {
  type?: string;
  identifier?: string;
  thumbnail?: string;
  message?: string;
  messageId?: MessageId;
  messageStatus?: ChatMessage["messageStatus"];
  receiverId?: UserId | null;
  senderId?: UserId;
  createdAt?: string | Date;
  totalUnreadMessages?: number;
  online?: boolean;
};

export type ActiveCall = {
  id: UserId;
  name?: string;
  profilePicture?: string;
  type?: CallDirection;
  callType?: CallMode;
  roomId?: number;
};

export type OnlineUsersEvent = {
  onlineUsers: UserId[];
};

export type PrivateMessageEvent = {
  message: ChatMessage;
  from?: UserId;
};

export type GroupMessageEvent = {
  message: ChatMessage;
  groupId?: GroupId;
};

export type MarkReadEvent = {
  id: UserId;
  receiverId?: UserId;
};

export type IncomingCallEvent = {
  from: ChatIdentity & { id: UserId; name?: string };
  roomId: number;
  callType: CallMode;
};

export type ChatStateUser = AppUserInfo;

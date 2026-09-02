import type { MutableRefObject } from "react";
import type { Socket } from "socket.io-client";
import type { AppUserInfo } from "@/lib/auth/userInfo";

export type UserId = number;
export type MessageId = number;
export type GroupId = string;
export type ConversationId = string;
export type ChatTargetId = UserId | GroupId;
export type ChatIdentityId = ChatTargetId;
export type ChatKind = "user" | "group";
export type MessageKind = "text" | "image" | "audio";

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
  identifier?: ChatKind;
  chatType?: ChatKind;
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
  type?: MessageKind;
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

export type ChatStateUser = AppUserInfo;

export const isUserId = (value: ChatTargetId): value is UserId =>
  typeof value === "number";

export const isGroupId = (value: ChatTargetId): value is GroupId =>
  typeof value === "string";

export const resolveChatKind = (
  value: Pick<ChatIdentity, "chatType" | "identifier"> | null | undefined
): ChatKind => value?.chatType ?? value?.identifier ?? "user";

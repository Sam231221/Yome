import { IconType } from "react-icons";
import type { NumericId } from "@/types/chat";

export type UserLite = {
  name: string;
  avatarUrl: string;
  email?: string;
  username?: string;
};

export type Story = {
  id: string;
  name: string;
  gradient: string;
  avatarGradient: string;
};

export type Reel = {
  id: string;
  title: string;
  creator: string;
  gradient: string;
};

export type Post = {
  id: string;
  author: string;
  time: string;
  content: string;
  mediaGradient: string;
  likes: number;
  comments: number;
  shares: number;
  avatarGradient: string;
};

export type Contact = {
  id: string | number;
  name: string;
  initials: string;
  gradient?: string;
  profilePicture?: string;
  identifier?: string;
  online: boolean;
};

export type DashboardContact = {
  id: number;
  name: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  profilePicture: string;
  identifier: "user";
  online: boolean;
};

export type DashboardUserRecord = {
  id: NumericId;
  name?: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  role?: string;
  identifier?: string;
  profilePicture?: string;
};

export type DashboardGroupRecord = {
  id: string;
  name?: string;
  about?: string;
  thumbnail?: string;
};

export type DashboardMessageParty = {
  id: NumericId;
  name?: string;
  profilePicture?: string;
};

export type DashboardMessageRecord = {
  id?: NumericId;
  senderId?: NumericId;
  receiverId?: NumericId | null;
  message?: string;
  type?: string;
  messageStatus?: string;
  createdAt?: string | Date;
  sender?: DashboardMessageParty;
  receiver?: DashboardMessageParty;
};

export type NavItem = {
  id: string;
  label: string;
  icon: IconType;
  badge?: string;
};

export type ShortcutItem = {
  id: string;
  label: string;
  gradient: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  isUnread: boolean;
  isNew: boolean;
  iconGradient: string;
  actions?: {
    primary: string;
    secondary?: string;
  };
};

export type Message = {
  id: string;
  from: "self" | "contact";
  text: string;
  time: string;
};

export type DashboardChatMessage = {
  id: number;
  senderId: number;
  receiverId: number | null;
  message: string;
  type: string;
  messageStatus: string;
  createdAt: string;
  sender?: {
    id: number;
    name?: string;
    profilePicture?: string;
  };
  receiver?: {
    id: number;
    name?: string;
    profilePicture?: string;
  };
};

export type DashboardChatSession = {
  messages: DashboardChatMessage[];
  isLoading: boolean;
  hasLoaded: boolean;
};

export type MessagesByContact = Record<string, Message[]>;

export type ChatWindowState = {
  contactId: string;
};

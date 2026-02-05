import { IconType } from "react-icons";

export type UserLite = {
  name: string;
  avatarUrl: string;
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
  id: string;
  name: string;
  initials: string;
  gradient: string;
  online: boolean;
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

export type MessagesByContact = Record<string, Message[]>;

export type ChatWindowState = {
  contactId: string;
};

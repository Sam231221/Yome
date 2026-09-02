import {
  Bell,
  Code2,
  ShieldCheck,
  Sun,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

export interface AccountSettingsValues {
  email: string;
  username: string;
  bio: string;
  firstname: string;
  lastname: string;
  address: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type SettingsTab =
  | "account"
  | "privacy"
  | "notifications"
  | "safety"
  | "appearance"
  | "moderation"
  | "system-states";

export type AccountPrefs = {
  discoverable: boolean;
  profileActivity: boolean;
  calls: boolean;
  groupInvites: boolean;
  push: boolean;
  email: boolean;
  quietHours: boolean;
  eventReminders: boolean;
  groupAnnouncements: boolean;
  reactions: boolean;
  filterRequests: boolean;
  blurMedia: boolean;
};

export const DEFAULT_ACCOUNT_SETTINGS_VALUES: AccountSettingsValues = {
  email: "",
  username: "",
  bio: "",
  firstname: "",
  lastname: "",
  address: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export const SETTINGS_TABS: Array<{
  key: SettingsTab;
  label: string;
  icon: ReactNode;
}> = [
  { key: "account", label: "Account", icon: <User size={17} /> },
  { key: "privacy", label: "Privacy", icon: <UserCheck size={17} /> },
  { key: "notifications", label: "Notifications", icon: <Bell size={17} /> },
  { key: "safety", label: "Safety", icon: <Users size={17} /> },
  { key: "appearance", label: "Appearance", icon: <Sun size={17} /> },
  { key: "moderation", label: "Moderation", icon: <ShieldCheck size={17} /> },
  { key: "system-states", label: "System states", icon: <Code2 size={17} /> },
];

export const DEFAULT_ACCOUNT_PREFS: AccountPrefs = {
  discoverable: true,
  profileActivity: false,
  calls: false,
  groupInvites: true,
  push: true,
  email: true,
  quietHours: true,
  eventReminders: true,
  groupAnnouncements: true,
  reactions: false,
  filterRequests: true,
  blurMedia: true,
};

export function buildAccountSettingsValues(
  userInfo:
    | {
        email?: string;
        username?: string;
        bio?: string;
        firstname?: string;
        lastname?: string;
        address?: string;
      }
    | null
    | undefined
): AccountSettingsValues {
  return {
    ...DEFAULT_ACCOUNT_SETTINGS_VALUES,
    email: userInfo?.email || "",
    username: userInfo?.username || "",
    bio: userInfo?.bio || "",
    firstname: userInfo?.firstname || "",
    lastname: userInfo?.lastname || "",
    address: userInfo?.address || "",
  };
}

export function isSettingsTab(value: string | null): value is SettingsTab {
  return SETTINGS_TABS.some((tab) => tab.key === value);
}

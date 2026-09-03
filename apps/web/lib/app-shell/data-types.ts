import type { YomeTone } from "@/types/yome-ui";

export type DashboardProfile = {
  id: number;
  name: string;
  firstName: string;
  username: string;
  role: string;
  initials: string;
  profilePicture: string;
  learningStreakDays: number;
  notificationCount: number;
};

export type DashboardSidebarGroup = {
  id: string;
  slug: string;
  name: string;
  title: string;
  symbol: string;
  tone: YomeTone;
};

export type DashboardHome = {
  profile: DashboardProfile;
  sidebarGroups: DashboardSidebarGroup[];
};

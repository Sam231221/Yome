import type { UserId } from "@/types/chat";
import type { YomeTone } from "@/features/learning/data";

export type DashboardUserRecord = {
  id: UserId;
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

export type DashboardFeedPost = {
  id: string;
  type: string;
  author: string;
  initials: string;
  tone: YomeTone;
  time: string;
  title: string;
  body: string;
  tags: string[];
  stat: string;
  detail: string;
  topAnswer?: { author: string; body: string } | null;
  project?: { team: string; progress: string; stack: string } | null;
  shareCount: number;
};

export type DashboardStudyRoom = {
  id: string;
  title: string;
  meta: string;
  symbol: string;
  tone: YomeTone;
  subject: string;
  topic: string;
  groupName: string;
  hostName: string;
  activeParticipantCount: number;
  participants: Array<{
    name: string;
    initials: string;
    profilePicture: string;
  }>;
};

export type DashboardSession = {
  id: string;
  title: string;
  day: string;
  month: string;
  meta: string;
  group: string;
  subject: string;
  tone: YomeTone;
  startsAt: string;
};

export type DashboardPerson = {
  id: number;
  name: string;
  role: string;
  shared: string;
  initials: string;
  tone: YomeTone;
  profilePicture: string;
};

export type DashboardTopic = {
  id: string;
  title: string;
  tone: YomeTone;
  posts: string;
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
  feedPosts: DashboardFeedPost[];
  liveStudyRooms: DashboardStudyRoom[];
  upcomingSessions: DashboardSession[];
  suggestedPeople: DashboardPerson[];
  trendingTopics: DashboardTopic[];
  sidebarGroups: DashboardSidebarGroup[];
};

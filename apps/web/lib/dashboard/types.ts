import type { UserId } from "@/types/chat";

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

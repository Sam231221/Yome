import axios from "axios";
import {
  CONNECT_USER_TO_MENTOR,
  CREATE_GROUP,
  DISCOVER_GROUPS,
  GET_CONNECTION_SUMMARY,
  GET_CONNECTION_SUGGESTIONS,
  GET_FOLLOWING_CONNECTIONS,
  GET_GROUP_DETAIL,
  GET_GROUP_INVITATIONS,
  GET_JOINED_GROUPS,
  JOIN_GROUP,
} from "@/utils/ApiRoutes";
import { getClientErrorMessage } from "@/lib/api/clientErrors";
import type { YomeTone } from "@/features/learning/data";

export type LearningUser = {
  id: number;
  name: string;
  username?: string;
  role: string;
  shared: string;
  initials: string;
  tone: YomeTone;
  profilePicture: string;
  isFollowing: boolean;
};

export type LearningGroup = {
  id: string;
  slug: string;
  title: string;
  name: string;
  members: string;
  memberCount: number;
  detail: string;
  about: string;
  subject: string;
  category: string;
  symbol: string;
  tone: YomeTone;
  thumbnail: string;
  tags: Array<{ label: string; tone: YomeTone }>;
  featured: boolean;
  activeThisWeek: number;
  projectCount: number;
  mentorCount: number;
  resourceCount: number;
  isJoined: boolean;
};

export type LearningResource = {
  id: string;
  slug: string;
  title: string;
  type: string;
  level: string;
  tone: YomeTone;
  description: string;
  authorName: string;
  saves: string;
};

export type LearningGroupDetail = LearningGroup & {
  privacy: string;
  location: string;
  createdAt: string;
  moderators: LearningUser[];
  members: LearningUser[];
  announcements: Array<{
    id: string;
    title: string;
    body: string;
    ctaLabel?: string;
    ctaHref?: string;
    pinned: boolean;
    createdAt: string;
    author: LearningUser | null;
  }>;
  events: Array<{
    id: string;
    title: string;
    type: string;
    startsAt: string;
    location: string;
    tone: YomeTone;
  }>;
  resources: LearningResource[];
};

export type ConnectionSummary = {
  connections: number;
  pendingRequests: number;
  following: number;
  sharedCommunities: number;
};

export type GroupInvitation = {
  id: string;
  status: string;
  createdAt: string;
  group: LearningGroup;
};

const DEFAULT_ERROR = "Unable to load learning data.";

export const getLearningErrorMessage = (
  error: unknown,
  fallback = DEFAULT_ERROR
) => getClientErrorMessage(error, fallback);

export async function getDiscoverGroups(params: {
  query?: string;
  subject?: string;
  sort?: string;
}) {
  const { data } = await axios.get(DISCOVER_GROUPS, { params });
  return (data?.groups ?? []) as LearningGroup[];
}

export async function getJoinedGroups(loggedInUserId: number) {
  const { data } = await axios.get(`${GET_JOINED_GROUPS}/${loggedInUserId}`);
  return (data?.groups ?? []) as LearningGroup[];
}

export async function getGroupInvitations(loggedInUserId: number) {
  const { data } = await axios.get(`${GET_GROUP_INVITATIONS}/${loggedInUserId}`);
  return (data?.invitations ?? []) as GroupInvitation[];
}

export async function getGroupDetail(id: string) {
  const { data } = await axios.get(`${GET_GROUP_DETAIL}/${id}`);
  return (data?.group ?? null) as LearningGroupDetail | null;
}

export async function joinLearningGroup(loggedInUserId: number, groupId: string) {
  const { data } = await axios.post(`${JOIN_GROUP}/${groupId}/join`, {
    loggedInUserId,
  });
  return data;
}

export async function createLearningGroup(input: {
  loggedInUserId: number;
  name: string;
  about?: string;
  subject?: string;
  category?: string;
  tone?: YomeTone;
  symbol?: string;
  privacy?: string;
  location?: string;
  thumbnail?: string;
  tags?: string[];
}) {
  const { data } = await axios.post(CREATE_GROUP, input);
  return data?.group as LearningGroup;
}

export async function getConnectionSummary(loggedInUserId: number) {
  const { data } = await axios.get(
    `${GET_CONNECTION_SUMMARY}/${loggedInUserId}`
  );
  return (data?.summary ?? {
    connections: 0,
    pendingRequests: 0,
    following: 0,
    sharedCommunities: 0,
  }) as ConnectionSummary;
}

export async function getConnectionSuggestions(loggedInUserId: number) {
  const { data } = await axios.get(
    `${GET_CONNECTION_SUGGESTIONS}/${loggedInUserId}`
  );
  return (data?.people ?? []) as LearningUser[];
}

export async function getFollowingConnections(loggedInUserId: number) {
  const { data } = await axios.get(
    `${GET_FOLLOWING_CONNECTIONS}/${loggedInUserId}`
  );
  return (data?.people ?? []) as LearningUser[];
}

export async function followLearningUser(loggedInUserId: number, mentorId: number) {
  const { data } = await axios.post(CONNECT_USER_TO_MENTOR, {
    loggedInUserId,
    mentorId,
  });
  return data;
}

import axios from "axios";
import {
  CONNECT_USER_TO_GROUP,
  CONNECT_USER_TO_MENTOR,
  GET_ALL_CONNECTED_USERS,
  GET_ALL_USERS,
  GET_DASHBOARD_HOME,
  GET_UNASSOCIATED_GROUPS,
  GET_UNFOLLOWED_MENTORS,
} from "@/utils/ApiRoutes";
import { getClientErrorMessage } from "@/lib/api/clientErrors";
import type {
  DashboardHome,
  DashboardGroupRecord,
  DashboardUserRecord,
} from "@/lib/dashboard/types";
import type { UserId } from "@/types/chat";
import type { YomeTone } from "@/features/learning/data";

type ConnectResponse = {
  status?: number;
  msg?: string;
  error?: string;
};

export type SuggestedDashboardUser = {
  id: number;
  name: string;
  subtitle: string;
  profilePicture: string;
};

export type SuggestedDashboardGroup = {
  id: string;
  name: string;
  about: string;
  thumbnail: string;
};

const DEFAULT_USER_AVATAR = "/avatars/userprofile.png";
const DEFAULT_GROUP_AVATAR = "/avatars/groupprofile.png";
const TONES = new Set<YomeTone>(["blue", "teal", "amber", "violet", "neutral"]);
const dashboardRequestConfig = { withCredentials: true };

const getDashboardErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again."
) => getClientErrorMessage(error, fallback);

const expectSuccessfulConnectResponse = (
  data: ConnectResponse | undefined,
  fallback: string
) => {
  if (data?.status === 200) {
    return data.msg || fallback;
  }

  throw new Error(data?.error || data?.msg || fallback);
};

export { getDashboardErrorMessage };

const asString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const asNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const asTone = (value: unknown): YomeTone =>
  typeof value === "string" && TONES.has(value as YomeTone)
    ? (value as YomeTone)
    : "blue";

export const normalizeDashboardHome = (input: Partial<DashboardHome> | undefined): DashboardHome => {
  const profile = input?.profile;
  return {
    profile: {
      id: asNumber(profile?.id),
      name: asString(profile?.name, "Yome user"),
      firstName: asString(profile?.firstName, asString(profile?.name, "Yome").split(" ")[0] || "Yome"),
      username: asString(profile?.username, "yomeuser"),
      role: asString(profile?.role, "Student"),
      initials: asString(profile?.initials, "Y"),
      profilePicture: asString(profile?.profilePicture),
      learningStreakDays: asNumber(profile?.learningStreakDays, 0),
      notificationCount: asNumber(profile?.notificationCount, 0),
    },
    feedPosts: (input?.feedPosts ?? []).map((post) => ({
      id: asString(post.id),
      type: asString(post.type, "Post"),
      author: asString(post.author, "Yome user"),
      initials: asString(post.initials, "Y"),
      tone: asTone(post.tone),
      time: asString(post.time, "now"),
      title: asString(post.title, "Untitled post"),
      body: asString(post.body),
      tags: Array.isArray(post.tags) ? post.tags.map((tag) => String(tag)) : [],
      stat: asString(post.stat, "0 helpful"),
      detail: asString(post.detail, "0 comments"),
      topAnswer: post.topAnswer
        ? {
            author: asString(post.topAnswer.author, "Yome mentor"),
            body: asString(post.topAnswer.body),
          }
        : null,
      project: post.project
        ? {
            team: asString(post.project.team),
            progress: asString(post.project.progress),
            stack: asString(post.project.stack),
          }
        : null,
      shareCount: asNumber(post.shareCount),
    })),
    liveStudyRooms: (input?.liveStudyRooms ?? []).map((room) => ({
      id: asString(room.id),
      title: asString(room.title, "Study room"),
      meta: asString(room.meta, "0 studying now"),
      symbol: asString(room.symbol, "Y"),
      tone: asTone(room.tone),
      activeParticipantCount: asNumber(room.activeParticipantCount),
      participants: (room.participants ?? []).map((participant) => ({
        name: asString(participant.name, "Yome user"),
        initials: asString(participant.initials, "Y"),
        profilePicture: asString(participant.profilePicture),
      })),
    })),
    upcomingSessions: (input?.upcomingSessions ?? []).map((session) => ({
      id: asString(session.id),
      title: asString(session.title, "Study session"),
      day: asString(session.day, "01"),
      month: asString(session.month, "JAN"),
      meta: asString(session.meta),
      group: asString(session.group, "Yome study group"),
      tone: asTone(session.tone),
      startsAt: asString(session.startsAt),
    })),
    suggestedPeople: (input?.suggestedPeople ?? []).map((person) => ({
      id: asNumber(person.id),
      name: asString(person.name, "Yome user"),
      role: asString(person.role, "Student"),
      shared: asString(person.shared, "Build your learning network on Yome"),
      initials: asString(person.initials, "Y"),
      tone: asTone(person.tone),
      profilePicture: asString(person.profilePicture),
    })),
    trendingTopics: (input?.trendingTopics ?? []).map((topic) => ({
      id: asString(topic.id),
      title: asString(topic.title, "Learning"),
      tone: asTone(topic.tone),
      posts: asString(topic.posts, "0 posts"),
    })),
    sidebarGroups: (input?.sidebarGroups ?? []).map((group) => ({
      id: asString(group.id),
      slug: asString(group.slug, asString(group.id)),
      name: asString(group.name, "Untitled group"),
      title: asString(group.title, asString(group.name, "Untitled group")),
      symbol: asString(group.symbol, "Y"),
      tone: asTone(group.tone),
    })),
  };
};

export const getDashboardHome = async (loggedInUserId: UserId) => {
  const { data } = await axios.get(
    `${GET_DASHBOARD_HOME}/${loggedInUserId}`,
    dashboardRequestConfig
  );
  return normalizeDashboardHome(data?.dashboard);
};

export const getSuggestedUserName = (user: DashboardUserRecord) =>
  [user.firstname, user.lastname].filter(Boolean).join(" ").trim() ||
  user.name ||
  user.username ||
  "Unknown user";

export const normalizeSuggestedUser = (
  user: DashboardUserRecord
): SuggestedDashboardUser => ({
  id: Number(user.id),
  name: getSuggestedUserName(user),
  subtitle: user.role ? `${user.role.toLowerCase()} on Yome` : "Yome user",
  profilePicture: user.profilePicture || DEFAULT_USER_AVATAR,
});

export const normalizeSuggestedGroup = (
  group: DashboardGroupRecord
): SuggestedDashboardGroup => ({
  id: group.id,
  name: group.name || "Untitled group",
  about: group.about || "Community group on Yome",
  thumbnail: group.thumbnail || DEFAULT_GROUP_AVATAR,
});

export const getPeopleSuggestions = async (loggedInUserId: UserId) => {
  const followedResponse = await axios.get(
    `${GET_ALL_CONNECTED_USERS}/${loggedInUserId}`
  );
  const followedUsers =
    (followedResponse.data?.followedUsers as DashboardUserRecord[] | undefined) ??
    [];

  const followedSet = new Set<number>(
    followedUsers.map((user) => Number(user.id))
  );
  const currentUserId = Number(loggedInUserId);

  let users: DashboardUserRecord[] = [];

  try {
    const allUsersResponse = await axios.get(GET_ALL_USERS);
    users =
      (allUsersResponse.data?.users as DashboardUserRecord[] | undefined) ?? [];
  } catch {
    const mentorsResponse = await axios.get(
      `${GET_UNFOLLOWED_MENTORS}/${loggedInUserId}`
    );
    users =
      (mentorsResponse.data?.mentorsNotFollowed as
        | DashboardUserRecord[]
        | undefined) ?? [];
  }

  return users
    .filter(
      (user) =>
        Number(user.id) !== currentUserId && !followedSet.has(Number(user.id))
    )
    .map(normalizeSuggestedUser);
};

export const getGroupSuggestions = async (loggedInUserId: UserId) => {
  const { data } = await axios.get(
    `${GET_UNASSOCIATED_GROUPS}/${loggedInUserId}`
  );

  const groups =
    (data?.unassociatedGroups as DashboardGroupRecord[] | undefined) ?? [];

  return groups.map(normalizeSuggestedGroup);
};

export const connectUserToMentor = async (
  loggedInUserId: UserId,
  mentorId: UserId
) => {
  const { data } = await axios.post<ConnectResponse>(CONNECT_USER_TO_MENTOR, {
    loggedInUserId: Number(loggedInUserId),
    mentorId: Number(mentorId),
  });

  return expectSuccessfulConnectResponse(data, "Unable to add friend.");
};

export const connectUserToGroup = async (
  loggedInUserId: UserId,
  groupIdToJoin: string
) => {
  const { data } = await axios.post<ConnectResponse>(CONNECT_USER_TO_GROUP, {
    loggedInUserId: Number(loggedInUserId),
    groupIdToJoin,
  });

  return expectSuccessfulConnectResponse(data, "Unable to join the group.");
};

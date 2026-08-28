import axios from "axios";
import {
  CONNECT_USER_TO_GROUP,
  CONNECT_USER_TO_MENTOR,
  GET_ALL_CONNECTED_USERS,
  GET_ALL_USERS,
  GET_UNASSOCIATED_GROUPS,
  GET_UNFOLLOWED_MENTORS,
} from "@/utils/ApiRoutes";
import { getClientErrorMessage } from "@/lib/api/clientErrors";
import type {
  DashboardGroupRecord,
  DashboardUserRecord,
} from "@/lib/dashboard/types";
import type { UserId } from "@/types/chat";

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

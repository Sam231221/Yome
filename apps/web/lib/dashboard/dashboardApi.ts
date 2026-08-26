import axios from "axios";
import {
  CONNECT_USER_TO_GROUP,
  CONNECT_USER_TO_MENTOR,
  GET_ALL_CONNECTED_USERS,
  GET_ALL_USERS,
  GET_UNASSOCIATED_GROUPS,
  GET_UNFOLLOWED_MENTORS,
} from "@/utils/ApiRoutes";
import type {
  DashboardGroupRecord,
  DashboardUserRecord,
} from "@/app/(main)/(dashboard)/dashboard/components/facebook/types";
import type { NumericId } from "@/types/chat";

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";

type ConnectResponse = {
  status?: number;
  msg?: string;
  error?: string;
};

const getDashboardErrorMessage = (
  error: unknown,
  fallback = DEFAULT_ERROR_MESSAGE
) => {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      typeof error.response?.data === "string"
        ? error.response.data
        : error.response?.data?.error || error.response?.data?.msg;

    if (responseMessage) {
      return responseMessage;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

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

export const getPeopleSuggestions = async (loggedInUserId: NumericId) => {
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

  return users.filter(
    (user) =>
      Number(user.id) !== currentUserId && !followedSet.has(Number(user.id))
  );
};

export const getGroupSuggestions = async (loggedInUserId: NumericId) => {
  const { data } = await axios.get(
    `${GET_UNASSOCIATED_GROUPS}/${loggedInUserId}`
  );

  return (data?.unassociatedGroups as DashboardGroupRecord[] | undefined) ?? [];
};

export const connectUserToMentor = async (
  loggedInUserId: NumericId,
  mentorId: NumericId
) => {
  const { data } = await axios.post<ConnectResponse>(CONNECT_USER_TO_MENTOR, {
    loggedInUserId: Number(loggedInUserId),
    mentorId: Number(mentorId),
  });

  return expectSuccessfulConnectResponse(data, "Unable to add friend.");
};

export const connectUserToGroup = async (
  loggedInUserId: NumericId,
  groupIdToJoin: string
) => {
  const { data } = await axios.post<ConnectResponse>(CONNECT_USER_TO_GROUP, {
    loggedInUserId: Number(loggedInUserId),
    groupIdToJoin,
  });

  return expectSuccessfulConnectResponse(data, "Unable to join the group.");
};

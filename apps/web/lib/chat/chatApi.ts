import axios from "axios";
import {
  ADD_AUDIO_MESSAGE_ROUTE,
  ADD_IMAGE_MESSAGE_ROUTE,
  ADD_MEDIA_MESSAGE_ROUTE,
  ADD_MESSAGE_ROUTE,
  GET_ALL_CONNECTED_GROUPS,
  GET_ALL_CONNECTED_USERS,
  GET_INITIAL_GROUP_MESSAGES,
  GET_INITIAL_USERS_MESSAGES,
  GET_MESSAGES_ROUTE,
  GET_USER_BY_ID_ROUTE,
} from "@/utils/ApiRoutes";
import type { ChatKind, ChatListItem } from "@/types/chat";

export type NumericId = number | string;

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";

type InitialGroupMessageRecord = {
  id?: NumericId;
  groupId?: string;
  message?: string;
  type?: string;
  messageStatus?: string;
  receiverId?: NumericId | null;
  senderId?: NumericId;
  createdAt?: string | Date;
};

type InitialGroupContactRecord = {
  id: string;
  name?: string;
  identifier?: string;
  type?: string;
  thumbnail?: string;
  messages?: InitialGroupMessageRecord[];
};

const getErrorMessage = (error: unknown, fallback = DEFAULT_ERROR_MESSAGE) => {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      typeof error.response?.data === "string"
        ? error.response.data
        : error.response?.data?.msg;

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

const uploadMedia = async (
  route: string,
  fieldName: "image" | "audio",
  file: File
) => {
  const formData = new FormData();
  formData.append(fieldName, file);

  const { data } = await axios.post(route, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const { url, type } = data ?? {};

  if (!url) {
    throw new Error("Upload failed");
  }

  return {
    url,
    type: type ?? (fieldName === "image" ? "image" : "audio"),
  };
};

const normalizeGroupContact = (
  group: InitialGroupContactRecord
): ChatListItem => {
  const latestMessage = group?.messages?.[0];

  return {
    ...group,
    ...latestMessage,
    id: String(group.id),
    type: group.identifier || group.type || "group",
    messageId: latestMessage?.id,
  };
};

export const getChatErrorMessage = getErrorMessage;

export const logChatBootstrapError = (context: string, error: unknown) => {
  console.warn(`[chat-bootstrap] ${context}: ${getErrorMessage(error)}`);
};

export const logChatConversationError = (context: string, error: unknown) => {
  console.warn(`[chat-conversation] ${context}: ${getErrorMessage(error)}`);
};

export const getConnectedUsers = async (loggedInUserId: NumericId) => {
  const { data } = await axios.get(
    `${GET_ALL_CONNECTED_USERS}/${loggedInUserId}`
  );
  return data?.followedUsers ?? [];
};

export const getInitialUserMeta = async (loggedInUserId: NumericId) => {
  const { data } = await axios.get(
    `${GET_INITIAL_USERS_MESSAGES}/${loggedInUserId}`
  );
  return {
    onlineUsers: data?.onlineUsers ?? [],
    usersWithLatestPivateMessages: data?.usersWithLatestPivateMessages ?? [],
  };
};

export const getInitialGroupMeta = async (loggedInUserId: NumericId) => {
  const { data } = await axios.get(
    `${GET_INITIAL_GROUP_MESSAGES}/${loggedInUserId}`
  );

  return (data?.groupsWithLatestGroupMessages ?? []).map(normalizeGroupContact);
};

export const getAllChatContacts = async (loggedInUserId: NumericId) => {
  const [usersResponse, groupsResponse] = await Promise.all([
    axios.get(`${GET_ALL_CONNECTED_USERS}/${loggedInUserId}`),
    axios.get(`${GET_ALL_CONNECTED_GROUPS}/${loggedInUserId}`),
  ]);

  return {
    followedUsers: usersResponse.data?.followedUsers ?? [],
    groups: groupsResponse.data?.groups ?? [],
  };
};

export const getUserConversation = async ({
  fromUserId,
  toUserId,
  chatType = "user",
}: {
  fromUserId: NumericId;
  toUserId: NumericId;
  chatType?: ChatKind;
}) => {
  const { data } = await axios.get(
    `${GET_MESSAGES_ROUTE}/${fromUserId}/${toUserId}/${chatType}`
  );
  return data?.messages ?? [];
};

export const sendTextMessage = async ({
  chatType,
  from,
  to,
  message,
}: {
  chatType: ChatKind;
  from: NumericId;
  to: NumericId;
  message: string;
}) => {
  const { data } = await axios.post(ADD_MESSAGE_ROUTE, {
    chatType,
    from,
    to,
    message,
  });
  return data?.message;
};

export const sendMediaMessage = async ({
  chatType,
  from,
  to,
  url,
  type,
}: {
  chatType: ChatKind;
  from: NumericId;
  to: NumericId;
  url: string;
  type: string;
}) => {
  const { data } = await axios.post(ADD_MEDIA_MESSAGE_ROUTE, {
    chatType,
    from,
    to,
    url,
    type,
  });
  return data?.message;
};

export const sendImageMessage = async ({
  chatType,
  from,
  to,
  file,
}: {
  chatType: ChatKind;
  from: NumericId;
  to: NumericId;
  file: File;
}) => {
  const upload = await uploadMedia(ADD_IMAGE_MESSAGE_ROUTE, "image", file);
  return sendMediaMessage({
    chatType,
    from,
    to,
    url: upload.url,
    type: upload.type,
  });
};

export const sendAudioMessage = async ({
  chatType,
  from,
  to,
  file,
}: {
  chatType: ChatKind;
  from: NumericId;
  to: NumericId;
  file: File;
}) => {
  const upload = await uploadMedia(ADD_AUDIO_MESSAGE_ROUTE, "audio", file);
  return sendMediaMessage({
    chatType,
    from,
    to,
    url: upload.url,
    type: upload.type,
  });
};

export const getUserById = async (userId: NumericId) => {
  const { data } = await axios.post(GET_USER_BY_ID_ROUTE, {
    userId,
  });
  return data?.user;
};

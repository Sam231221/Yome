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
  GET_OR_CREATE_DIRECT_CONVERSATION_ROUTE,
  GET_USER_BY_ID_ROUTE,
} from "@/utils/ApiRoutes";
import type {
  ChatKind,
  ChatListItem,
  ConversationId,
  GroupId,
  MessageId,
  MessageKind,
  UserId,
} from "@/types/chat";

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";

type InitialGroupMessageRecord = {
  id?: MessageId;
  groupId?: GroupId;
  conversationId?: ConversationId | null;
  message?: string;
  type?: MessageKind;
  messageStatus?: "sent" | "delivered" | "read";
  receiverId?: UserId | null;
  senderId?: UserId;
  createdAt?: string | Date;
};

type InitialGroupContactRecord = {
  id: GroupId;
  name?: string;
  identifier?: ChatKind;
  chatType?: ChatKind;
  thumbnail?: string;
  messages?: InitialGroupMessageRecord[];
};

type DirectConversationRecord = {
  id: ConversationId;
};

type InitialDirectContactRecord = ChatListItem & {
  id: UserId;
  identifier?: ChatKind;
  chatType?: ChatKind;
};

const getErrorMessage = (error: unknown, fallback = DEFAULT_ERROR_MESSAGE) => {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      typeof error.response?.data === "string"
        ? error.response.data
        : error.response?.data?.msg ?? error.response?.data?.error;

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
  file: File,
  metadata: {
    chatType: ChatKind;
    from: UserId;
    to: UserId | GroupId;
    conversationId?: ConversationId;
  }
) => {
  const formData = new FormData();
  formData.append(fieldName, file);
  formData.append("chatType", metadata.chatType);
  formData.append("from", String(metadata.from));
  formData.append("to", String(metadata.to));
  if (metadata.conversationId) {
    formData.append("conversationId", metadata.conversationId);
  }

  const { data } = await axios.post(route, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const { url, type } = data ?? {};

  if (!url) {
    throw new Error("Upload failed");
  }

  return {
    url,
    type: (type ?? (fieldName === "image" ? "image" : "audio")) as Exclude<
      MessageKind,
      "text"
    >,
  };
};

const normalizeGroupContact = (
  group: InitialGroupContactRecord
): ChatListItem => {
  const latestMessage = group?.messages?.[0];

  return {
    name: group.name,
    thumbnail: group.thumbnail,
    message: latestMessage?.message,
    type: latestMessage?.type,
    messageStatus: latestMessage?.messageStatus,
    createdAt: latestMessage?.createdAt,
    receiverId: latestMessage?.receiverId,
    senderId: latestMessage?.senderId,
    conversationId: latestMessage?.conversationId,
    id: String(group.id),
    chatType: group.identifier || group.chatType || "group",
    identifier: group.identifier || group.chatType || "group",
    messageId: latestMessage?.id,
  };
};

const normalizeDirectContact = (
  contact: InitialDirectContactRecord
): ChatListItem => ({
  ...contact,
  id: Number(contact.id),
  chatType: contact.chatType || contact.identifier || "user",
  identifier: contact.identifier || contact.chatType || "user",
  receiverId:
    typeof contact.receiverId === "number" ? contact.receiverId : null,
  senderId: typeof contact.senderId === "number" ? contact.senderId : undefined,
});

export const getChatErrorMessage = getErrorMessage;

export const logChatBootstrapError = (context: string, error: unknown) => {
  console.warn(`[chat-bootstrap] ${context}: ${getErrorMessage(error)}`);
};

export const logChatConversationError = (context: string, error: unknown) => {
  console.warn(`[chat-conversation] ${context}: ${getErrorMessage(error)}`);
};

export const getConnectedUsers = async (loggedInUserId: UserId) => {
  const { data } = await axios.get(
    `${GET_ALL_CONNECTED_USERS}/${loggedInUserId}`
  );
  return data?.followedUsers ?? [];
};

export const getOrCreateDirectConversation = async (
  from: UserId,
  to: UserId
) => {
  const { data } = await axios.post(GET_OR_CREATE_DIRECT_CONVERSATION_ROUTE, {
    from,
    to,
  });

  return (data?.conversation ?? null) as DirectConversationRecord | null;
};

export const getInitialUserMeta = async (loggedInUserId: UserId) => {
  const { data } = await axios.get(
    `${GET_INITIAL_USERS_MESSAGES}/${loggedInUserId}`
  );
  const usersWithLatestPrivateMessages =
    (data?.usersWithLatestPrivateMessages ?? []).map(normalizeDirectContact);

  return {
    onlineUsers: (data?.onlineUsers ?? []) as UserId[],
    usersWithLatestPrivateMessages,
  };
};

export const getInitialGroupMeta = async (loggedInUserId: UserId) => {
  const { data } = await axios.get(
    `${GET_INITIAL_GROUP_MESSAGES}/${loggedInUserId}`
  );

  return (data?.groupsWithLatestGroupMessages ?? []).map(normalizeGroupContact);
};

export const getAllChatContacts = async (loggedInUserId: UserId) => {
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
  fromUserId: UserId;
  toUserId: UserId | GroupId;
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
  from: UserId;
  to: UserId | GroupId;
  message: string;
}) => {
  if (chatType === "user") {
    await getOrCreateDirectConversation(from, to as UserId);
  }

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
  conversationId,
}: {
  chatType: ChatKind;
  from: UserId;
  to: UserId | GroupId;
  url: string;
  type: Exclude<MessageKind, "text">;
  conversationId?: ConversationId;
}) => {
  const { data } = await axios.post(ADD_MEDIA_MESSAGE_ROUTE, {
    chatType,
    from,
    to,
    url,
    type,
    conversationId,
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
  from: UserId;
  to: UserId | GroupId;
  file: File;
}) => {
  const conversation =
    chatType === "user"
      ? await getOrCreateDirectConversation(from, to as UserId)
      : null;

  const upload = await uploadMedia(ADD_IMAGE_MESSAGE_ROUTE, "image", file, {
    chatType,
    from,
    to,
    conversationId: conversation?.id,
  });
  return sendMediaMessage({
    chatType,
    from,
    to,
    url: upload.url,
    type: upload.type,
    conversationId: conversation?.id,
  });
};

export const sendAudioMessage = async ({
  chatType,
  from,
  to,
  file,
}: {
  chatType: ChatKind;
  from: UserId;
  to: UserId | GroupId;
  file: File;
}) => {
  const conversation =
    chatType === "user"
      ? await getOrCreateDirectConversation(from, to as UserId)
      : null;

  const upload = await uploadMedia(ADD_AUDIO_MESSAGE_ROUTE, "audio", file, {
    chatType,
    from,
    to,
    conversationId: conversation?.id,
  });
  return sendMediaMessage({
    chatType,
    from,
    to,
    url: upload.url,
    type: upload.type,
    conversationId: conversation?.id,
  });
};

export const getUserById = async (userId: UserId) => {
  const { data } = await axios.post(GET_USER_BY_ID_ROUTE, {
    userId,
  });
  return data?.user;
};

import axios from "axios";
import {
  ADD_AUDIO_MESSAGE_ROUTE,
  ADD_IMAGE_MESSAGE_ROUTE,
  ADD_MESSAGE_ROUTE,
  GET_ALL_CONNECTED_USERS,
  GET_INITIAL_USERS_MESSAGES,
  GET_MESSAGES_ROUTE,
  GET_USER_BY_ID_ROUTE,
} from "@/utils/ApiRoutes";

type NumericId = number | string;

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

export const getUserConversation = async ({
  fromUserId,
  toUserId,
}: {
  fromUserId: NumericId;
  toUserId: NumericId;
}) => {
  const { data } = await axios.get(
    `${GET_MESSAGES_ROUTE}/${fromUserId}/${toUserId}/user`
  );
  return data?.messages ?? [];
};

export const sendTextMessage = async ({
  from,
  to,
  message,
}: {
  from: NumericId;
  to: NumericId;
  message: string;
}) => {
  const { data } = await axios.post(ADD_MESSAGE_ROUTE, {
    chatType: "user",
    from,
    to,
    message,
  });
  return data?.message;
};

export const sendImageMessage = async ({
  from,
  to,
  file,
}: {
  from: NumericId;
  to: NumericId;
  file: File;
}) => {
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await axios.post(ADD_IMAGE_MESSAGE_ROUTE, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    params: {
      chatType: "user",
      from,
      to,
    },
  });
  return data?.message;
};

export const sendAudioMessage = async ({
  from,
  to,
  file,
}: {
  from: NumericId;
  to: NumericId;
  file: File;
}) => {
  const formData = new FormData();
  formData.append("audio", file);

  const { data } = await axios.post(ADD_AUDIO_MESSAGE_ROUTE, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    params: {
      chatType: "user",
      from,
      to,
    },
  });
  return data?.message;
};

export const getUserById = async (userId: NumericId) => {
  const { data } = await axios.post(GET_USER_BY_ID_ROUTE, {
    userId,
  });
  return data?.user;
};

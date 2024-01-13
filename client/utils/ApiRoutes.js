export const HOST = process.env.NEXT_PUBLIC_BACKEND_API;

const authRoute = `${HOST}/api/auth`;
const MESSAGES_ROUTE = `${HOST}/api/messages`;
const GROUP_MESSAGES_ROUTE = `${HOST}/api/group-messages`;

export const REGISTER_USER = `${authRoute}/register-user`;
export const UPDATE_USER = `${authRoute}/update-user`;
export const GET_USER_ROUTE = `${authRoute}/get-user`;
export const GET_GROUP_ROUTE = `${authRoute}/get-group`;
export const GET_ALL_USERS = `${authRoute}/get-all-users`;
export const GET_ALL_CONNECTED_USERS = `${authRoute}/get-connected-users`;
export const GET_ALL_GROUPS = `${authRoute}/get-all-groups`;
export const GET_ALL_CONNECTED_GROUPS = `${authRoute}/get-connected-groups`;

export const GET_UNFOLLOWED_MENTORS = `${authRoute}/get-unfollowed-mentors`;
export const GET_UNASSOCIATED_GROUPS = `${authRoute}/get-unassociated-groups`;
export const CONNECT_USER_TO_MENTOR = `${authRoute}/connect-user-to-mentor`;
export const CONNECT_USER_TO_GROUP = `${authRoute}/connect-user-to-group`;

export const GET_CALL_TOKEN = `${authRoute}/generate-token`;

//One to One Message
export const ADD_MESSAGE_ROUTE = `${MESSAGES_ROUTE}/add-message`;
export const GET_MESSAGES_ROUTE = `${MESSAGES_ROUTE}/get-messages`;
export const GET_INITIAL_USERS_MESSAGES = `${MESSAGES_ROUTE}/get-initial-contacts`;
export const ADD_AUDIO_MESSAGE_ROUTE = `${MESSAGES_ROUTE}/add-audio-message`;
export const ADD_IMAGE_MESSAGE_ROUTE = `${MESSAGES_ROUTE}/add-image-message`;

//GROUP Message
export const GET_SINGLE_GROUP = `${GROUP_MESSAGES_ROUTE}/get-group`;

export const ADD_GROUP_MESSAGE = `${GROUP_MESSAGES_ROUTE}/add-message`;
export const GET_GROUP_MESSAGES = `${GROUP_MESSAGES_ROUTE}/get-messages`;
export const GET_INITIAL_GROUP_MESSAGES = `${GROUP_MESSAGES_ROUTE}/get-initial-group-messages`;
export const ADD_GROUP_AUDIO_MESSAGE = `${GROUP_MESSAGES_ROUTE}/add-audio-message`;
export const ADD_GROUP_IMAGE_MESSAGE = `${GROUP_MESSAGES_ROUTE}/add-image-message`;

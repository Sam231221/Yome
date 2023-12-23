export const HOST = process.env.NEXT_PUBLIC_BACKEND_API;

const authRoute = `${HOST}/api/auth`;
const MESSAGES_ROUTE = `${HOST}/api/messages`;
const GROUP_MESSAGES_ROUTE = `${HOST}/api/group-messages`;

export const onBoardUserRoute = `${authRoute}/onboarduser`;
export const GET_USER_ROUTE = `${authRoute}/get-user`;
export const GET_GROUP_ROUTE = `${authRoute}/get-group`;
export const GET_ALL_USERS = `${authRoute}/get-users`;
export const GET_ALL_GROUPS = `${authRoute}/get-groups`;
export const GET_CALL_TOKEN = `${authRoute}/generate-token`;

//One to One Message
export const ADD_MESSAGE_ROUTE = `${MESSAGES_ROUTE}/add-message`;
export const GET_MESSAGES_ROUTE = `${MESSAGES_ROUTE}/get-messages`;
export const GET_INITIAL_CONTACTS_ROUTE = `${MESSAGES_ROUTE}/get-initial-contacts`;
export const ADD_AUDIO_MESSAGE_ROUTE = `${MESSAGES_ROUTE}/add-audio-message`;
export const ADD_IMAGE_MESSAGE_ROUTE = `${MESSAGES_ROUTE}/add-image-message`;

//GROUP Message
export const GET_SINGLE_GROUP = `${GROUP_MESSAGES_ROUTE}/get-group`;

export const ADD_GROUP_MESSAGE = `${GROUP_MESSAGES_ROUTE}/add-message`;
export const GET_GROUP_MESSAGES = `${GROUP_MESSAGES_ROUTE}/get-messages`;
export const GET_INITIAL_GROUP_MESSAGES = `${GROUP_MESSAGES_ROUTE}/get-initial-group-messages`;
export const ADD_GROUP_AUDIO_MESSAGE = `${GROUP_MESSAGES_ROUTE}/add-audio-message`;
export const ADD_GROUP_IMAGE_MESSAGE = `${GROUP_MESSAGES_ROUTE}/add-image-message`;

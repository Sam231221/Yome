/** Gateway base URL for REST API (all /api/* requests go through gateway). */
export const HOST = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:4100";
/** Chat service URL for Socket.IO (direct connection; WebSocket cannot use HTTP gateway). */
export const CHAT_SOCKET_URL = process.env.NEXT_PUBLIC_CHAT_SOCKET_URL || "http://localhost:4103";

const AUTH_ROUTE = `${HOST}/api/auth`;
const USER_ROUTE = `${HOST}/api/user`;
const MESSAGES_ROUTE = `${HOST}/api/messages`;

export const REGISTER_USER = `${AUTH_ROUTE}/register-user`;
export const GET_USER_ROUTE = `${AUTH_ROUTE}/get-user`;
export const VERIFY_CREDENTIALS_ROUTE = `${AUTH_ROUTE}/verify-credentials`;
export const UPSERT_OAUTH_USER_ROUTE = `${AUTH_ROUTE}/oauth-user`;
export const CHANGE_PASSWORD_ROUTE = `${AUTH_ROUTE}/change-password`;

// User service (profiles, groups, follow)
export const GET_USER_BY_ID_ROUTE = `${USER_ROUTE}/get-user-by-id`;
export const UPDATE_USER = `${USER_ROUTE}/update-user`;
export const GET_ALL_USERS = `${USER_ROUTE}/get-all-users`;
export const GET_ALL_GROUPS = `${USER_ROUTE}/get-all-groups`;
export const GET_ALL_CONNECTED_GROUPS = `${USER_ROUTE}/get-connected-groups`;
export const CONNECT_USER_TO_GROUP = `${USER_ROUTE}/connect-user-to-group`;
export const GET_UNASSOCIATED_GROUPS = `${USER_ROUTE}/get-unassociated-groups`;
export const GET_ALL_CONNECTED_USERS = `${USER_ROUTE}/get-connected-users`;
export const GET_UNFOLLOWED_MENTORS = `${USER_ROUTE}/get-unfollowed-mentors`;
export const CONNECT_USER_TO_MENTOR = `${USER_ROUTE}/connect-user-to-mentor`;

//For user and groups
export const GET_MESSAGES_ROUTE = `${MESSAGES_ROUTE}/get-messages`;
export const GET_OR_CREATE_DIRECT_CONVERSATION_ROUTE = `${MESSAGES_ROUTE}/get-or-create-direct-conversation`;

//One to One Message
export const ADD_MESSAGE_ROUTE = `${MESSAGES_ROUTE}/add-message`;
export const GET_INITIAL_GROUP_MESSAGES = `${MESSAGES_ROUTE}/get-initial-group-messages`;
export const GET_INITIAL_USERS_MESSAGES = `${MESSAGES_ROUTE}/get-initial-contacts`;
export const ADD_AUDIO_MESSAGE_ROUTE = `${HOST}/api/media/add-audio-message`;
export const ADD_IMAGE_MESSAGE_ROUTE = `${HOST}/api/media/add-image-message`;
export const ADD_MEDIA_MESSAGE_ROUTE = `${MESSAGES_ROUTE}/add-media-message`;

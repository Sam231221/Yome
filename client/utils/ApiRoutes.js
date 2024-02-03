export const HOST = process.env.NEXT_PUBLIC_BACKEND_API;

const AUTH_ROUTE = `${HOST}/api/auth`;
const EI_ROUTE = `${HOST}/api/ei`;
const MESSAGES_ROUTE = `${HOST}/api/messages`;

export const REGISTER_USER = `${AUTH_ROUTE}/register-user`;
export const UPDATE_USER = `${AUTH_ROUTE}/update-user`;
export const GET_USER_ROUTE = `${AUTH_ROUTE}/get-user`;
export const GET_USER_BY_ID_ROUTE = `${AUTH_ROUTE}/get-user-by-id`;
export const GET_ALL_USERS = `${AUTH_ROUTE}/get-all-users`;

//Educational Institutions
export const GET_ALL_EDUCATIONAL_INSTITUTIONS = `${EI_ROUTE}/get-all-educational-institutions`;
export const CREATE_EDUCATIONAL_INSTITUTION = `${EI_ROUTE}/create-educational-institution`;

//Subscriptions
export const GET_USER_SUBSCRIPTION_PLAN = `${AUTH_ROUTE}/get-user-subscription-plan`;
export const UPDATE_USER_SUBSCRIPTION_PLAN_BY_ID = `${AUTH_ROUTE}/update-user-subscription-plan-by-id`;
export const UPDATE_USER_SUBSCRIPTION_PLAN_BY_SUBSCRIPTIONID = `${AUTH_ROUTE}/update-user-subscription-plan-by-subscriptionid`;
export const MANAGE_STRIPE_SUBSCRIPTION_ACTION = `${AUTH_ROUTE}/manage-stripe-subscription-action`;

//Group Connections
export const GET_ALL_GROUPS = `${AUTH_ROUTE}/get-all-groups`;
export const GET_ALL_CONNECTED_GROUPS = `${AUTH_ROUTE}/get-connected-groups`;
export const CONNECT_USER_TO_GROUP = `${AUTH_ROUTE}/connect-user-to-group`;
export const GET_UNASSOCIATED_GROUPS = `${AUTH_ROUTE}/get-unassociated-groups`;

//User Connections
export const GET_ALL_CONNECTED_USERS = `${AUTH_ROUTE}/get-connected-users`;
export const GET_UNFOLLOWED_MENTORS = `${AUTH_ROUTE}/get-unfollowed-mentors`;
export const CONNECT_USER_TO_MENTOR = `${AUTH_ROUTE}/connect-user-to-mentor`;
export const GET_CALL_TOKEN = `${AUTH_ROUTE}/generate-token`;

//For user and groups
export const GET_MESSAGES_ROUTE = `${MESSAGES_ROUTE}/get-messages`;

//One to One Message
export const ADD_MESSAGE_ROUTE = `${MESSAGES_ROUTE}/add-message`;
export const GET_INITIAL_GROUP_MESSAGES = `${MESSAGES_ROUTE}/get-initial-group-messages`;
export const GET_INITIAL_USERS_MESSAGES = `${MESSAGES_ROUTE}/get-initial-contacts`;
export const ADD_AUDIO_MESSAGE_ROUTE = `${MESSAGES_ROUTE}/add-audio-message`;
export const ADD_IMAGE_MESSAGE_ROUTE = `${MESSAGES_ROUTE}/add-image-message`;

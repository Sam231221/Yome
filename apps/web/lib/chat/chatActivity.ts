/** Fired on window whenever a chat message arrives over the socket, on any page. Listeners
 * (the app shell's unread badges) refetch their counts from the server in response. */
export const CHAT_ACTIVITY_EVENT = "yome:chat-activity";

export const emitChatActivity = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHAT_ACTIVITY_EVENT));
};

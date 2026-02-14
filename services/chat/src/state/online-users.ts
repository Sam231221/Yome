/** Module-scoped map: userId -> socketId. Used by message controller and socket handlers. */
export const onlineUsers = new Map<string, string>();

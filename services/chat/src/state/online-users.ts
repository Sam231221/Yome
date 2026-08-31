/** Module-scoped map: userId -> socketIds. Used by message controller and socket handlers. */
export const onlineUsers = new Map<string, Set<string>>();

export const addOnlineUserSocket = (userId: string, socketId: string) => {
  const sockets = onlineUsers.get(userId) ?? new Set<string>();
  sockets.add(socketId);
  onlineUsers.set(userId, sockets);
};

export const removeOnlineUserSocket = (userId: string, socketId: string) => {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;

  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
  }
};

export const removeSocketFromOnlineUsers = (socketId: string) => {
  for (const [userId, sockets] of onlineUsers.entries()) {
    if (!sockets.has(socketId)) continue;
    removeOnlineUserSocket(userId, socketId);
    return;
  }
};

export const getOnlineUserIds = () =>
  Array.from(onlineUsers.keys()).map((id) => Number(id));

export const getOnlineUserSockets = (userId: string | number) =>
  Array.from(onlineUsers.get(String(userId)) ?? []);

export const isUserOnline = (userId: string | number) =>
  getOnlineUserSockets(userId).length > 0;

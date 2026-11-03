"use client";

import { type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { reducerCases } from "@/context/constants";
import { useStateProvider } from "@/context/StateContext";
import { useChatSocket } from "@/hooks/useChatSocket";
import { emitChatActivity } from "@/lib/chat/chatActivity";
import { playNotificationSound } from "@/lib/chat/notificationSound";

/**
 * Owns the single chat socket for the whole signed-in app, so incoming messages are handled
 * (and the sidebar/bell counts refreshed) on every page, not just /chat.
 */
export function ChatRealtimeProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [{ userInfo, currentChatUser }, dispatch] = useStateProvider();

  const sessionUserId = Number((session?.user as { id?: unknown } | undefined)?.id);
  const userId =
    userInfo?.id ?? (Number.isInteger(sessionUserId) && sessionUserId > 0 ? sessionUserId : undefined);

  useChatSocket({
    userId,
    onSocketReady: (socketRef) => {
      dispatch({ type: reducerCases.SET_SOCKET, socket: socketRef });
    },
    onPrivateMessageReceived: (data) => {
      const senderId = Number(data?.message?.senderId ?? data?.from);
      if (!currentChatUser || Number(currentChatUser.id) !== senderId) {
        playNotificationSound();
      }
      // The reducer routes by the logged-in user's id, so wait until it is loaded.
      if (userInfo) {
        dispatch({
          type: reducerCases.ADD_USER_MESSAGE,
          newMessage: {
            ...data.message,
          },
        });
      }
      emitChatActivity();
    },
    onGroupMessageReceived: (data) => {
      if (userInfo) {
        dispatch({
          type: reducerCases.ADD_GROUP_MESSAGE,
          newMessage: {
            ...data.message,
            groupId:
              typeof data.groupId === "undefined" ? null : String(data.groupId),
          },
        });
      }
      emitChatActivity();
    },
    onOnlineUsers: ({ onlineUsers }) => {
      dispatch({
        type: reducerCases.SET_ONLINE_USERS,
        onlineUsers,
      });
    },
    onMarkReadReceived: ({ id, receiverId }) => {
      if (typeof receiverId === "undefined") return;
      dispatch({
        type: reducerCases.SET_MESSAGES_READ,
        id,
        receiverId,
      });
    },
  });

  return <>{children}</>;
}

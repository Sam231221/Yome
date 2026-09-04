"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthState } from "@/features/auth/providers/AuthStateProvider";
import { chatReducerCases } from "@/features/chat/state/chat-reducer";
import { useChatState } from "@/features/chat/state/ChatStateContext";
import { useChatSocket } from "@/features/chat/hooks/useChatSocket";
import {
  ensureUserInfo,
  getUserInfoErrorMessage,
  logUserInfoLoadError,
} from "@/lib/auth/userInfo";
import { getUserConversation, logChatConversationError } from "@/features/chat/api/chatApi";
import { playNotificationSound } from "@/features/chat/lib/notificationSound";
import { resolveChatKind, type ChatKind } from "@/features/chat/types";

export function useChatPageController() {
  const [chatState, chatDispatch] = useChatState();
  const [{ userInfo }, { setUserInfo }] = useAuthState();
  const { currentChatUser, userContacts, groupContacts } = chatState;
  const [isUserLoading, setIsUserLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!session?.user || userInfo) return;

        const loaded = await ensureUserInfo({
          sessionUser: session.user,
          currentUserInfo: userInfo,
          setUserInfo,
        });

        if (!loaded && !cancelled) {
          toast.error("User not found. Please login again.");
          router.push("/login");
          return;
        }

        if (loaded && !cancelled) {
          setIsUserLoading(false);
        }
      } catch (error) {
        logUserInfoLoadError("chat page session bootstrap", error);
        if (!cancelled) {
          toast.error(
            getUserInfoErrorMessage(error, "Failed to load user information")
          );
          setIsUserLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [router, session?.user, setUserInfo, userInfo]);

  useEffect(() => {
    if (userInfo?.id) {
      setIsUserLoading(false);
    }
  }, [userInfo?.id]);

  const socket = useChatSocket({
    userId: userInfo?.id,
    onSocketReady: (socketRef) => {
      chatDispatch({ type: chatReducerCases.SET_SOCKET, socket: socketRef });
      setIsUserLoading(false);
    },
    onPrivateMessageReceived: (data) => {
      const senderId = Number(data?.message?.senderId ?? data?.from);
      if (!currentChatUser || Number(currentChatUser.id) !== senderId) {
        playNotificationSound();
      }
      chatDispatch({
        type: chatReducerCases.ADD_USER_MESSAGE,
        newMessage: {
          ...data.message,
        },
        currentUserId: userInfo?.id,
      });
    },
    onGroupMessageReceived: (data) => {
      chatDispatch({
        type: chatReducerCases.ADD_GROUP_MESSAGE,
        newMessage: {
          ...data.message,
          groupId:
            typeof data.groupId === "undefined" ? null : String(data.groupId),
        },
      });
    },
    onOnlineUsers: ({ onlineUsers }) => {
      chatDispatch({
        type: chatReducerCases.SET_ONLINE_USERS,
        onlineUsers,
      });
    },
    onMarkReadReceived: ({ id, receiverId }) => {
      if (typeof receiverId === "undefined") return;
      chatDispatch({
        type: chatReducerCases.SET_MESSAGES_READ,
        id,
        receiverId,
      });
    },
  });

  useEffect(() => {
    if (userInfo?.id && socket.current) {
      setIsUserLoading(false);
    }
  }, [userInfo?.id, socket]);

  useEffect(() => {
    if (socket.current) {
      chatDispatch({
        type: chatReducerCases.SET_SOCKET,
        socket,
      });
    }
  }, [chatDispatch, socket]);

  useEffect(() => {
    const getMessages = async () => {
      if (!userInfo?.id || !currentChatUser?.id) return;

      try {
        const messages = await getUserConversation({
          fromUserId: userInfo.id,
          toUserId: currentChatUser.id,
          chatType: resolveChatKind(currentChatUser) as ChatKind,
        });
        chatDispatch({ type: chatReducerCases.SET_MESSAGES, messages });
      } catch (error) {
        logChatConversationError("load active conversation", error);
      }
    };

    const activeContactExists =
      currentChatUser &&
      userInfo &&
      [...userContacts, ...groupContacts].some(
        (contact) => contact.id === currentChatUser.id
      );

    if (activeContactExists) {
      void getMessages();
    }
  }, [chatDispatch, currentChatUser, groupContacts, userContacts, userInfo]);

  return {
    currentChatUser,
    isUserLoading,
  };
}

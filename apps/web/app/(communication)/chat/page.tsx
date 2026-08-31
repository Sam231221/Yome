"use client";
import React, { useEffect, useState } from "react";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import ChatLeftBar from "@/features/chat/components/ChatLeftBar";
import ChatRightBar from "@/features/chat/components/ChatRightBar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useChatSocket } from "@/hooks/useChatSocket";
import { playNotificationSound } from "@/lib/chat/notificationSound";
import {
  ensureUserInfo,
  getUserInfoErrorMessage,
  logUserInfoLoadError,
} from "@/lib/auth/userInfo";
import { YomeAppShell } from "@/components/layout";
import { getUserConversation, logChatConversationError } from "@/lib/chat/chatApi";
import { resolveChatKind, type ChatKind } from "@/types/chat";
import StreamVideoProvider from "@/providers/StreamClientProvider";
import { IncomingDirectCallOverlay } from "@/features/chat/direct-call/IncomingDirectCallOverlay";
import { useStreamClientStatus } from "@/providers/stream-client-status";

function StreamIncomingCallLayer() {
  const { isReady } = useStreamClientStatus();

  if (!isReady) return null;

  return <IncomingDirectCallOverlay />;
}

export default function Chatpage() {
  const [
    {
      userInfo,
      currentChatUser,
      userContacts,
      groupContacts,
    },
    dispatch,
  ] = useStateProvider();
  const [isUserLoading, setIsUserLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();

  // Get user info from session if not already set
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!session?.user || userInfo) return;
        const loaded = await ensureUserInfo({
          sessionUser: session.user,
          currentUserInfo: userInfo,
          dispatch,
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
  }, [session, userInfo, dispatch, router]);

  useEffect(() => {
    if (userInfo?.id) {
      setIsUserLoading(false);
    }
  }, [userInfo?.id]);

  const socket = useChatSocket({
    userId: userInfo?.id,
    onSocketReady: (socketRef) => {
      dispatch({ type: reducerCases.SET_SOCKET, socket: socketRef });
      setIsUserLoading(false);
    },
    onPrivateMessageReceived: (data) => {
      const senderId = Number(data?.message?.senderId ?? data?.from);
      if (!currentChatUser || Number(currentChatUser.id) !== senderId) {
        playNotificationSound();
      }
      dispatch({
        type: reducerCases.ADD_USER_MESSAGE,
        newMessage: {
          ...data.message,
        },
      });
    },
    onGroupMessageReceived: (data) => {
      dispatch({
        type: reducerCases.ADD_GROUP_MESSAGE,
        newMessage: {
          ...data.message,
          groupId:
            typeof data.groupId === "undefined" ? null : String(data.groupId),
        },
      });
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

  useEffect(() => {
    if (userInfo?.id && socket.current) {
      setIsUserLoading(false);
    }
  }, [userInfo?.id, socket]);

  useEffect(() => {
    if (socket.current) {
        dispatch({
          type: reducerCases.SET_SOCKET,
          socket,
        });
    }
  }, [dispatch, socket]);

  //Changes current user/group and get messages for it.
  useEffect(() => {
    const getMessages = async () => {
      if (!userInfo?.id || !currentChatUser?.id) return;

      try {
        const messages = await getUserConversation({
          fromUserId: userInfo.id,
          toUserId: currentChatUser.id,
          chatType: resolveChatKind(currentChatUser) as ChatKind,
        });
        dispatch({ type: reducerCases.SET_MESSAGES, messages });
      } catch (error) {
        logChatConversationError("load active conversation", error);
      }
    };

    if (
      currentChatUser &&
      userInfo &&
      [...userContacts, ...groupContacts].findIndex(
        (contact) => contact.id === currentChatUser.id
      ) !== -1
    ) {
      getMessages();
    }
  }, [currentChatUser, userInfo, userContacts, groupContacts, dispatch]);

  return (
    <YomeAppShell>
      <section className="messages-board">
        <div className="messages-page flex-1 min-h-0 min-w-0">
          <div
            className={`chat-inbox-pane h-full overflow-hidden ${
              currentChatUser ? "has-active-chat" : ""
            }`}
          >
            <ChatLeftBar isUserLoading={isUserLoading} />
          </div>
          <div
            className={`chat-conversation-pane h-full overflow-hidden ${
              currentChatUser ? "has-active-chat" : ""
            }`}
          >
            <StreamVideoProvider>
              <StreamIncomingCallLayer />
              <ChatRightBar />
            </StreamVideoProvider>
          </div>
        </div>
      </section>
    </YomeAppShell>
  );
}

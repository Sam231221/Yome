"use client";
import React, { useEffect, useState } from "react";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import IncomingCall from "@/components/common/IncomingCall";
import IncomingVideoCall from "@/components/common/IncomingVideoCall";
import VideoCall from "./components/Call/VideoCall";
import VoiceCall from "./components/Call/VoiceCall";
import ChatLeftBar from "./components/ChatLeftBar";
import ChatRightBar from "./components/ChatRightBar";
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
import { YomeAppShell } from "@/components/yome/YomeUI";
import { getUserConversation, logChatConversationError } from "@/lib/chat/chatApi";
import { resolveChatKind, type ActiveCall, type ChatKind, type UserId } from "@/types/chat";

function createIncomingCall(
  from: { id: UserId; name?: string; profilePicture?: string },
  roomId: number,
  callType: "audio" | "video"
): ActiveCall {
  return {
    id: from.id,
    name: from.name ?? "Unknown caller",
    profilePicture: from.profilePicture,
    roomId,
    callType,
    type: "in-coming",
  };
}

export default function Chatpage() {
  const [
    {
      userInfo,
      currentChatUser,
      videoCall,
      voiceCall,
      incomingVoiceCall,
      incomingVideoCall,
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
    onIncomingVoiceCall: ({ from, roomId, callType }) => {
      dispatch({
        type: reducerCases.SET_INCOMING_VOICE_CALL,
        incomingVoiceCall: createIncomingCall(from, roomId, callType),
      });
    },
    onVoiceCallRejected: () => {
      dispatch({
        type: reducerCases.SET_INCOMING_VOICE_CALL,
        incomingVoiceCall: undefined,
      });
      dispatch({
        type: reducerCases.SET_VOICE_CALL,
        voiceCall: undefined,
      });
    },
    onIncomingVideoCall: ({ from, roomId, callType }) => {
      dispatch({
        type: reducerCases.SET_INCOMING_VIDEO_CALL,
        incomingVideoCall: createIncomingCall(from, roomId, callType),
      });
    },
    onVideoCallRejected: () => {
      dispatch({
        type: reducerCases.SET_INCOMING_VIDEO_CALL,
        incomingVideoCall: undefined,
      });
      dispatch({
        type: reducerCases.SET_VIDEO_CALL,
        videoCall: undefined,
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
    <>
      {/* giving notification of call in chatpage */}
      {incomingVoiceCall && <IncomingCall />}
      {incomingVideoCall && <IncomingVideoCall />}

      {/* if any user picks video/voice call container of full resolution will be shown */}
      {videoCall && (
        <div className="h-screen w-screen max-h-full max-w-full overflow-hidden">
          <VideoCall />
        </div>
      )}
      {voiceCall && (
        <div className="h-screen w-screen max-h-full max-w-full overflow-hidden">
          <VoiceCall />
        </div>
      )}

      {!videoCall && !voiceCall && (
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
                <ChatRightBar />
              </div>
            </div>
          </section>
        </YomeAppShell>
      )}
    </>
  );
}

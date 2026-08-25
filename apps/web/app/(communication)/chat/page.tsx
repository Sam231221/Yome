"use client";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import IncomingCall from "@/components/common/IncomingCall";
import IncomingVideoCall from "@/components/common/IncomingVideoCall";
import { GET_MESSAGES_ROUTE } from "@/utils/ApiRoutes";
import VideoCall from "./components/Call/VideoCall";
import VoiceCall from "./components/Call/VoiceCall";
import ChatLeftBar from "./components/ChatLeftBar";
import ChatRightBar from "./components/ChatRightBar";
import ChatSideNav from "./components/ChatSideNav";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useChatSocket } from "@/hooks/useChatSocket";
import { playNotificationSound } from "@/lib/chat/notificationSound";
import { ensureUserInfo } from "@/lib/auth/userInfo";
import type { ActiveCall, NumericId } from "@/types/chat";

function createIncomingCall(
  from: { id: NumericId; name?: string; profilePicture?: string },
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
        console.error("Error fetching user info:", error);
        if (!cancelled) {
          toast.error("Failed to load user information");
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
    onMarkReadReceived: ({ id, receiverId, recieverId }) => {
      const resolvedReceiverId = receiverId ?? recieverId;
      if (typeof resolvedReceiverId === "undefined") return;
      dispatch({
        type: reducerCases.SET_MESSAGES_READ,
        id,
        recieverId: resolvedReceiverId,
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
        const {
          data: { messages },
        } = await axios.get(
          `${GET_MESSAGES_ROUTE}/${userInfo.id}/${currentChatUser.id}/${currentChatUser.type || currentChatUser.identifier || "user"}`
        );
        dispatch({ type: reducerCases.SET_MESSAGES, messages });
      } catch (error) {
        console.error("Error fetching messages:", error);
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
        <div className="h-screen w-screen bg-[#E9EDF5] lg:px-4 lg:py-4 md:px-0 md:py-0 px-0 py-0">
          <div className="h-full w-full lg:rounded-2xl md:rounded-none rounded-none bg-white/90 lg:shadow-[0_25px_60px_rgba(15,23,42,0.18)] md:shadow-none shadow-none lg:border md:border-none border-none border-[#E6E8EE] overflow-hidden flex">
            {/* Hide ChatSideNav on medium and smaller screens */}
            <div className="hidden lg:block">
              <ChatSideNav />
            </div>
            <div className="flex-1 grid md:grid-cols-[340px_1fr] lg:grid-cols-[360px_1fr] grid-cols-1 min-h-0 min-w-0">
              {/* On small screens (<768px): show only ChatLeftBar OR ChatRightBar, not both */}
              {/* On medium+ screens (>=768px): show both side by side via grid */}
              <div className={`${
                currentChatUser ? 'hidden md:block' : 'block'
              } h-full overflow-hidden`}>
                <ChatLeftBar isUserLoading={isUserLoading} />
              </div>
              <div className={`${
                currentChatUser ? 'block' : 'hidden md:block'
              } h-full overflow-hidden`}>
                <ChatRightBar />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

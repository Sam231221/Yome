"use client";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import IncomingCall from "@/components/common/IncomingCall";
import IncomingVideoCall from "@/components/common/IncomingVideoCall";
import { GET_MESSAGES_ROUTE, GET_USER_ROUTE, HOST } from "@/utils/ApiRoutes";
import VideoCall from "./components/Call/VideoCall";
import VoiceCall from "./components/Call/VoiceCall";
import ChatLeftBar from "./components/ChatLeftBar";
import ChatRightBar from "./components/ChatRightBar";
import ChatSideNav from "./components/ChatSideNav";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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
  const socket = useRef<Socket | null>(null);
  const [socketEvent, setSocketEvent] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  // Get user info from session if not already set
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        if (session?.user && !userInfo) {
          const { data } = await axios.post(GET_USER_ROUTE, {
            email: session.user.email,
          });

          if (data.status) {
            dispatch({
              type: reducerCases.SET_USER_INFO,
              userInfo: {
                id: data.user.id,
                role: data.user.role,
                email: data.user.email,
                name: data.user.name,
                username: data.user.username,
                firstname: data.user.firstname,
                lastname: data.user.lastname,
                userProfile: data.user.userProfile,
                identifier: data.user.identifier,
                profilePicture: data.user.profilePicture,
                status: data.user.about,
              },
            });
          } else {
            toast.error("User not found. Please login again.");
            router.push("/login");
          }
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        toast.error("Failed to load user information");
      }
    };

    if (session && !userInfo) {
      getUserInfo();
    }
  }, [session, userInfo, dispatch, router]);

  //start socket connection on adding authenticated user.
  useEffect(() => {
    if (userInfo) {
      socket.current = io(HOST);
      socket.current.emit("add-user", userInfo.id);
      dispatch({ type: reducerCases.SET_SOCKET, socket });
      setIsUserLoading(false);
    }
  }, [userInfo, dispatch]);

  //add message when msg-receive is triggered
  useEffect(() => {
    if (socket.current && !socketEvent) {
      socket.current.on("privateMessageReceived", (data) => {
        dispatch({
          type: reducerCases.ADD_USER_MESSAGE,
          newMessage: {
            ...data.message,
          },
        });
      });

      socket.current.on("msg-recieve", (data) => {
        dispatch({
          type: reducerCases.ADD_GROUP_MESSAGE,
          newMessage: {
            ...data.message,
            groupId: data.groupId,
          },
        });
      });

      socket.current.on("online-users", ({ onlineUsers }) => {
        dispatch({
          type: reducerCases.SET_ONLINE_USERS,
          onlineUsers,
        });
      });

      socket.current.on("mark-read-recieve", ({ id, recieverId }) => {
        dispatch({
          type: reducerCases.SET_MESSAGES_READ,
          id,
          recieverId,
        });
      });

      socket.current.on("incoming-voice-call", ({ from, roomId, callType }) => {
        dispatch({
          type: reducerCases.SET_INCOMING_VOICE_CALL,
          incomingVoiceCall: { ...from, roomId, callType },
        });
      });

      socket.current.on("voice-call-rejected", () => {
        dispatch({
          type: reducerCases.SET_INCOMING_VOICE_CALL,
          incomingVoiceCall: undefined,
        });
        dispatch({
          type: reducerCases.SET_VOICE_CALL,
          voiceCall: undefined,
        });
      });

      socket.current.on("incoming-video-call", ({ from, roomId, callType }) => {
        dispatch({
          type: reducerCases.SET_INCOMING_VIDEO_CALL,
          incomingVideoCall: { ...from, roomId, callType },
        });
      });

      socket.current.on("video-call-rejected", () => {
        dispatch({
          type: reducerCases.SET_INCOMING_VIDEO_CALL,
          incomingVideoCall: undefined,
        });
        dispatch({
          type: reducerCases.SET_VIDEO_CALL,
          videoCall: undefined,
        });
      });

      setSocketEvent(true);
    }
  }, [socket.current, dispatch, socketEvent]);

  //Changes current user/group and get messages for it.
  useEffect(() => {
    const getMessages = async () => {
      if (!userInfo?.id || !currentChatUser?.id) return;

      try {
        const {
          data: { messages },
        } = await axios.get(
          `${GET_MESSAGES_ROUTE}/${userInfo.id}/${currentChatUser.id}/${currentChatUser.type}`
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

      {/* #region agent log */}
      {(() => { fetch('http://127.0.0.1:7243/ingest/3e9d039c-923e-469d-a996-c24e5de167f3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:render',message:'Chat page rendering layout',data:{hasCurrentChatUser:!!currentChatUser,currentChatUserId:currentChatUser?.id,currentChatUserName:currentChatUser?.name,windowInnerWidth:typeof window!=='undefined'?window.innerWidth:0},timestamp:Date.now(),hypothesisId:'H3,H5'})}).catch(()=>{}); return null; })()}
      {/* #endregion */}
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

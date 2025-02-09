"use client";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import IncomingCall from "@/components/common/IncomingCall";
import IncomingVideoCall from "@/components/common/IncomingVideoCall";
import { GET_MESSAGES_ROUTE, HOST } from "@/utils/ApiRoutes";
import VideoCall from "./components/Call/VideoCall";
import VoiceCall from "./components/Call/VoiceCall";
import ChatLeftBar from "./components/ChatLeftBar";
import ChatRightBar from "./components/ChatRightBar";

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
      const {
        data: { messages },
      } = await axios.get(
        `${GET_MESSAGES_ROUTE}/${userInfo.id}/${currentChatUser.id}/${currentChatUser.type}`
      );
      dispatch({ type: reducerCases.SET_MESSAGES, messages });
    };

    if (
      currentChatUser &&
      [...userContacts, ...groupContacts].findIndex(
        (contact) => contact.id === currentChatUser.id
      ) !== -1
    ) {
      getMessages();
    }
  }, [currentChatUser, userInfo.id, userContacts, groupContacts, dispatch]);

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
        <div className="grid xs:grid-cols-1 sm:grid-cols-main h-screen w-screen max-h-screen max-w-full overflow-hidden">
          {/* Sidebar */}
          <ChatLeftBar isUserLoading={isUserLoading} />
          {/* ChatContainer */}
          <ChatRightBar />
        </div>
      )}
    </>
  );
}

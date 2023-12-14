import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import Chat from "@/components/Chat/Chat";
import ChatList from "@/components/Chatlist/ChatList";
import { firebaseAuth } from "../utils/FirebaseConfig";
import { useRouter } from "next/router";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import axios from "axios";
import { GET_USER_ROUTE, GET_MESSAGES_ROUTE, HOST } from "@/utils/ApiRoutes";
import Empty from "./Empty";
import Container from "./Call/Container";
import VideoCall from "./Call/VideoCall";
import VoiceCall from "./Call/VoiceCall";
import IncomingCall from "./common/IncomingCall";
import IncomingVideoCall from "./common/IncomingVideoCall";
import SearchMessages from "./Chat/SearchMessages";

export default function Main() {
  const [
    {
      userInfo,
      currentChatUser,
      videoCall,
      voiceCall,
      incomingVoiceCall,
      incomingVideoCall,
      messageSearch,
      userContacts,
    },
    dispatch,
  ] = useStateProvider();
  const router = useRouter();
  const socket = useRef();
  const [redirectToLoginPage, setRedirectLogin] = useState(false);
  const [socketEvent, setSocketEvent] = useState(false);

  //firebase function for handling authentication
  onAuthStateChanged(firebaseAuth, async (currentUser) => {
    if (!currentUser) setRedirectLogin(true);
    if (!userInfo && currentUser?.email) {
      //check if the user object with this email exists
      const { data } = await axios.post(GET_USER_ROUTE, {
        email: currentUser.email,
      });
      //if not then redirect to login page.
      if (!data.status) {
        router.push("/login");
      }

      //get the user from database and populate useInfo state
      dispatch({
        type: reducerCases.SET_USER_INFO,
        userInfo: {
          id: data?.data?.id,
          email: data?.data?.email,
          name: data?.data?.name,
          profileImage: data?.data?.profilePicture,
          status: data?.data?.about,
        },
      });
    }
  });

  useEffect(() => {
    if (redirectToLoginPage) router.push("/login");
  }, [redirectToLoginPage]);

  //start socket connection on adding user.
  useEffect(() => {
    if (userInfo) {
      socket.current = io(HOST);
      socket.current.emit("add-user", userInfo.id);
      dispatch({ type: reducerCases.SET_SOCKET, socket });
    }
  }, [userInfo]);

  //add message when msg-receive is triggered
  useEffect(() => {
    if (socket.current && !socketEvent) {
      socket.current.on("msg-recieve", (data) => {
        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: {
            ...data.message,
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
  }, [socket.current]);

  useEffect(() => {
    const getMessages = async () => {
      const {
        data: { messages },
      } = await axios.get(
        `${GET_MESSAGES_ROUTE}/${userInfo.id}/${currentChatUser.id}`
      );
      dispatch({ type: reducerCases.SET_MESSAGES, messages });
    };
    if (
      currentChatUser &&
      userContacts.findIndex((contact) => contact.id === currentChatUser.id) !==
        -1
    ) {
      getMessages();
    }
  }, [currentChatUser]);

  return (
    <>
      {incomingVoiceCall && <IncomingCall />}
      {incomingVideoCall && <IncomingVideoCall />}

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
        <div className="grid grid-cols-main h-screen w-screen max-h-screen max-w-full overflow-hidden">
          <ChatList />
          {currentChatUser ? (
            <div className={messageSearch ? "grid grid-cols-2" : "grid-cols-2"}>
              <Chat />
              {messageSearch && <SearchMessages />}
            </div>
          ) : (
            <Empty />
          )}
        </div>
      )}
    </>
  );
}

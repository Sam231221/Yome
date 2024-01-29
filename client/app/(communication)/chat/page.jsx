"use client";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Chat from "./components/Chat/Chat";
import ChatList from "./components/Chatlist/ChatList";
import { useRouter } from "next/navigation";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";

import { GET_USER_ROUTE, GET_MESSAGES_ROUTE, HOST } from "@/utils/ApiRoutes";
import Empty from "@/components/Empty";
import VideoCall from "./components/Call/VideoCall";
import VoiceCall from "./components/Call/VoiceCall";
import IncomingCall from "@/components/common/IncomingCall";
import IncomingVideoCall from "@/components/common/IncomingVideoCall";
import SearchMessages from "./components/Chat/SearchMessages";
import { useSession } from "next-auth/react";
export default function Chatpage() {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
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
      groupContacts,
    },
    dispatch,
  ] = useStateProvider();

  const handleResize = () => {
    setWindowWidth(window.innerWidth);
  };

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const socket = useRef();

  const [socketEvent, setSocketEvent] = useState(false);
  const { data: session } = useSession();

  //Get user from Db and set 'userInfo'
  useEffect(() => {
    getUserInfo();
  }, [session]);

  const getUserInfo = async (e) => {
    try {
      if (session?.user) {
        if (!userInfo) {
          let { data } = await axios.post(GET_USER_ROUTE, {
            email: session?.user.email,
          });

          //Get the user from database and populate useInfo state
          dispatch({
            type: reducerCases.SET_USER_INFO,
            userInfo: {
              id: data?.user?.id,
              role: data?.user?.role,
              email: data?.user?.email,
              name: data?.user?.name,
              username: data?.user?.username,
              firstname: data?.user?.firstname,
              lastname: data?.user?.lastname,
              userProfile: data?.user?.userProfile,
              identifier: data?.user?.identifier,
              profilePicture: data?.user?.profilePicture,
              status: data?.user?.about,
            },
          });
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  //start socket connection on adding authenticated user.
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
  }, [socket.current]);

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
  }, [currentChatUser]);
  const isMobileView = windowWidth < 720;
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
        <div className="grid xs:grid-cols-1 sm:grid-cols-main h-screen w-screen max-h-screen max-w-full overflow-hidden">
          {/* Sidebar */}
          <ChatList />

          {/* ChatContainer */}
          {currentChatUser ? (
            <div className={messageSearch ? "grid grid-cols-2" : "grid-cols-2"}>
              <Chat
                id={currentChatUser.id}
                chatType={currentChatUser.identifier}
              />
              {messageSearch && <SearchMessages />}
            </div>
          ) : (
            <>{isMobileView ? <></> : <Empty />}</>
          )}
        </div>
      )}
    </>
  );
}

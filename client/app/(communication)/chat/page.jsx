"use client";
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Chat from "./components/Chat/Chat";
import ChatList from "./components/Chatlist/ChatList";
import { useRouter } from "next/navigation";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import axios from "axios";
import {
  GET_USER_ROUTE,
  GET_MESSAGES_ROUTE,
  HOST,
  GET_GROUP_MESSAGES,
} from "@/utils/ApiRoutes";
import Empty from "@/components/Empty";
import VideoCall from "./components/Call/VideoCall";
import VoiceCall from "./components/Call/VoiceCall";
import IncomingCall from "@/components/common/IncomingCall";
import IncomingVideoCall from "@/components/common/IncomingVideoCall";
import SearchMessages from "./components/Chat/SearchMessages";
import { useSession } from "next-auth/react";
export default function Chatpage() {
  const [
    {
      userInfo,
      currentChatGroup,
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
  const router = useRouter();
  const socket = useRef();

  const [socketEvent, setSocketEvent] = useState(false);
  const { data: session } = useSession();

  //get user and Set 'userInfo'
  useEffect(() => {
    const getUserInfo = async (e) => {
      try {
        if (session?.user) {
          if (!userInfo) {
            let { data } = await axios.post(GET_USER_ROUTE, {
              email: session?.user.email,
            });
            //check if the user object with this email is logged in
            // if not then redirect to login page.
            if (!data.status) {
              router.push("/login");
            }

            //get the user from database and populate useInfo state
            dispatch({
              type: reducerCases.SET_USER_INFO,
              userInfo: {
                id: data?.user?.id,
                email: data?.user?.email,
                name: data?.user?.name,
                identifier: data?.user?.identifier,
                profileImage: data?.user?.profilePicture,
                status: data?.user?.about,
              },
            });
          }
        }
      } catch (e) {
        console.log(e);
      }
    };
    getUserInfo();
  }, [session]);

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
      // Handling incoming messages from the server
      socket.current.on("privateMessageReceived", (data) => {
        // Handle received private message here
        console.log("Received private message:", data);
        // Update UI or perform other actions with the received private message
        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: {
            ...data.message,
          },
        });
      });

      socket.current.on("groupMessageReceived", (data) => {
        // Handle received group message here
        console.log("Received group message:", data);
        // Update UI or perform other actions with the received group message
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

  //tiggers when current chat user is active by clicking on
  //chatlist items
  //getmessages for current chat user or chat group
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
      console.log("togeered");
      getMessages();
    }
    console.log("currentChatUser:", currentChatUser);
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

          {/* Initially ChatUser is undefined  so display empty component*/}
          {/* currentchatUser is not "undefined" only when user clicks chat list item */}
          {/* if only currentchatUser is active, display rightbar  else Empty*/}
          {currentChatUser ? (
            <div className={messageSearch ? "grid grid-cols-2" : "grid-cols-2"}>
              <Chat
                id={currentChatUser.id}
                chatType={currentChatUser.identifier}
              />
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

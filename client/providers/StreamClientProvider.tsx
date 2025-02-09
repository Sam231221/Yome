"use client";

import { ReactNode, useEffect, useState } from "react";
//used to interact with the Stream Video API.
import { StreamVideoClient, StreamVideo } from "@stream-io/video-react-sdk";
import { GET_USER_ROUTE, GET_MESSAGES_ROUTE, HOST } from "@/utils/ApiRoutes";

import { tokenProvider } from "@/actions/stream.actions";
import { useStateProvider } from "@/context/StateContext";
import Loader from "@/components/common/Loader";
import { useSession } from "next-auth/react";
import { reducerCases } from "@/context/constants";
import axios from "axios";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY as string;

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const { data: session } = useSession();
  const [{ userInfo }, dispatch] = useStateProvider();
  useEffect(() => {
    getUserInfo();
  }, [session]);
  useEffect(() => {
    if (!userInfo) return;
    if (!API_KEY) throw new Error("Stream API key is missing");

    // Initialize the Stream Video client
    const client = new StreamVideoClient({
      apiKey: API_KEY,
      // Set the user details
      user: {
        //needs to be in string format complusory,
        id: String(userInfo.id),
        name: userInfo.username,
        profileImage: userInfo.profilePicture,
      },
      // function send to this that generates a token for authenticating with the Stream Video API.
      tokenProvider,
    });

    setVideoClient(client);
  }, [userInfo]);
  const getUserInfo = async () => {
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
    } catch (e) {}
  };
  console.log(userInfo, ":adasd:", API_KEY);
  if (!videoClient) return <Loader />;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
//Once the videoClient is initialized, the component wraps its children with the StreamVideo provider, passing the videoClient as a prop. This makes the video client available to all child components.

"use client";

import { ReactNode, useEffect, useState } from "react";
//used to interact with the Stream Video API.
import { StreamVideoClient, StreamVideo } from "@stream-io/video-react-sdk";

import { tokenProvider } from "@/actions/stream.actions";
import { useStateProvider } from "@/context/StateContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ensureUserInfo } from "@/lib/auth/userInfo";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY as string;

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const [isResolvingUser, setIsResolvingUser] = useState(false);
  const [setupError, setSetupError] = useState<string>();
  const { data: session, status } = useSession();
  const [{ userInfo }, dispatch] = useStateProvider();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        if (!session?.user || userInfo) return;
        setIsResolvingUser(true);
        const loadedUser = await ensureUserInfo({
          sessionUser: session.user,
          currentUserInfo: userInfo,
          dispatch,
        });
        if (!loadedUser) {
          setSetupError("Unable to load your account for this call.");
        }
      } catch {
        setSetupError("Unable to load your account for this call.");
      } finally {
        setIsResolvingUser(false);
      }
    };
    void load();
  }, [session, userInfo, dispatch]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  useEffect(() => {
    if (!userInfo || !API_KEY) return;

    // Initialize the Stream Video client
    const client = new StreamVideoClient({
      apiKey: API_KEY,
      // Set the user details
      user: {
        //needs to be in string format complusory,
        id: String(userInfo.id),
        name: userInfo.username,
        image: userInfo.profilePicture,
      },
      // function send to this that generates a token for authenticating with the Stream Video API.
      tokenProvider,
    });

    setVideoClient(client);
    return () => {
      setVideoClient(undefined);
      void client.disconnectUser();
    };
  }, [userInfo]);

  if (status === "unauthenticated") {
    return (
      <main className="grid min-h-screen w-full place-items-center bg-[#080d1b] px-6 text-center text-white">
        <p className="text-lg font-semibold">Redirecting to login...</p>
      </main>
    );
  }

  if (setupError || (status === "authenticated" && !API_KEY)) {
    return (
      <main className="grid min-h-screen w-full place-items-center bg-[#080d1b] px-6 text-center text-white">
        <p className="text-lg font-semibold">
          {setupError ?? "Call setup is unavailable right now."}
        </p>
      </main>
    );
  }

  if (
    status === "loading" ||
    isResolvingUser ||
    (status === "authenticated" && !videoClient)
  ) {
    return (
      <main className="grid min-h-screen w-full place-items-center bg-[#080d1b] px-6 text-center text-white">
        <p className="text-lg font-semibold">Preparing call...</p>
      </main>
    );
  }

  if (!videoClient) {
    return null;
  }

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
//Once the videoClient is initialized, the component wraps its children with the StreamVideo provider, passing the videoClient as a prop. This makes the video client available to all child components.

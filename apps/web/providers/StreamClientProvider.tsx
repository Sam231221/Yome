"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { StreamVideoClient, StreamVideo } from "@stream-io/video-react-sdk";

import { tokenProvider } from "@/actions/stream.actions";
import { useStateProvider } from "@/context/StateContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ensureUserInfo } from "@/lib/auth/userInfo";
import {
  StreamClientStatusContext,
  type StreamClientStatus,
} from "./stream-client-status";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY as string;
const INVALID_STREAM_API_KEYS = new Set(["", "your_stream_api_key", "change-me"]);

const hasValidStreamConfig = () =>
  !INVALID_STREAM_API_KEYS.has(String(API_KEY ?? "").trim());

const StreamVideoProvider = ({
  children,
  blocking = false,
}: {
  children: ReactNode;
  blocking?: boolean;
}) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const [isResolvingUser, setIsResolvingUser] = useState(false);
  const [setupError, setSetupError] = useState<string>();
  const { data: session, status } = useSession();
  const [{ userInfo }, dispatch] = useStateProvider();
  const router = useRouter();
  const isConfigured = hasValidStreamConfig();

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
    if (!isConfigured) {
      setVideoClient(undefined);
      setSetupError(
        "Calls are unavailable until valid Stream credentials are added in .env."
      );
      return;
    }

    setSetupError(undefined);

    if (!userInfo) {
      setVideoClient(undefined);
      return;
    }

    try {
      const client = StreamVideoClient.getOrCreateInstance({
        apiKey: API_KEY,
        user: {
          id: String(userInfo.id),
          name: userInfo.username || userInfo.name || `User ${userInfo.id}`,
          image: userInfo.profilePicture,
        },
        tokenProvider,
      });

      setVideoClient(client);
      setSetupError(undefined);
    } catch {
      setVideoClient(undefined);
      setSetupError("We couldn't prepare the Stream call client.");
    }
  }, [isConfigured, userInfo]);

  const statusValue = useMemo<StreamClientStatus>(
    () => ({
      client: videoClient,
      isReady: Boolean(videoClient),
      isConfigured,
      isLoading: status === "loading" || isResolvingUser,
      setupError: isConfigured ? setupError : setupError,
    }),
    [videoClient, isConfigured, isResolvingUser, setupError, status]
  );

  if (status === "unauthenticated") {
    return (
      <main className="grid min-h-screen w-full place-items-center bg-[#080d1b] px-6 text-center text-white">
        <p className="text-lg font-semibold">Redirecting to login...</p>
      </main>
    );
  }

  if (
    blocking &&
    (setupError || (status === "authenticated" && !isConfigured))
  ) {
    return (
      <main className="grid min-h-screen w-full place-items-center bg-[#080d1b] px-6 text-center text-white">
        <p className="text-lg font-semibold">
          {setupError ?? "Call setup is unavailable right now."}
        </p>
      </main>
    );
  }

  if (
    blocking &&
    (status === "loading" ||
      isResolvingUser ||
      (status === "authenticated" && isConfigured && !videoClient))
  ) {
    return (
      <main className="grid min-h-screen w-full place-items-center bg-[#080d1b] px-6 text-center text-white">
        <p className="text-lg font-semibold">Preparing call...</p>
      </main>
    );
  }

  if (!videoClient) {
    return (
      <StreamClientStatusContext.Provider value={statusValue}>
        <>{children}</>
      </StreamClientStatusContext.Provider>
    );
  }

  return (
    <StreamClientStatusContext.Provider value={statusValue}>
      <StreamVideo client={videoClient}>{children}</StreamVideo>
    </StreamClientStatusContext.Provider>
  );
};

export default StreamVideoProvider;

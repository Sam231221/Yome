"use client";

import { useState } from "react";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { useParams } from "next/navigation";
import { Loader } from "lucide-react";

import { useGetCallById } from "@/hooks/useGetCallById";

import MeetingSetup from "./components/MeetingSetup";
import MeetingRoom from "./components/MeetingRoom";

import { useStateProvider } from "@/context/StateContext";
import StreamVideoProvider from "@/providers/StreamClientProvider";

const VideoChatOnBoardingContent = () => {
  const [{ userInfo }] = useStateProvider();
  //get the id of an  specific call
  const { id } = useParams();
  const callId = id === undefined ? "" : Array.isArray(id) ? id[0] : id;

  const { call, isCallLoading } = useGetCallById(callId);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  if (isCallLoading) return <Loader />;

  if (!call)
    return (
      <p className="text-center text-3xl font-bold text-white">
        Call Not Found
      </p>
    );

  // get more info about custom call type:  https://getstream.io/video/docs/react/guides/configuring-call-types/
  const notAllowed =
    call.type === "invited" &&
    (!userInfo ||
      !call.state.members.find((m) => String(m.user.id) === String(userInfo.id)));

  if (notAllowed) return <h1>not allowed</h1>;

  return (
    <main className="h-screen w-full bg-dropdown-background">
      <StreamCall call={call}>
        <StreamTheme>
          {!isSetupComplete ? (
            <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
          ) : (
            <MeetingRoom />
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  );
};

export default function VideoChatOnBoardingPage() {
  return (
    <StreamVideoProvider>
      <VideoChatOnBoardingContent />
    </StreamVideoProvider>
  );
}

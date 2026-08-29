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

  if (isCallLoading) {
    return (
      <main className="grid min-h-screen w-full place-items-center bg-[#080d1b] text-white">
        <Loader className="size-8 animate-spin" />
      </main>
    );
  }

  if (!call)
    return (
      <main className="grid min-h-screen w-full place-items-center bg-[#080d1b] px-6 text-center text-white">
        <p className="text-3xl font-bold">Call Not Found</p>
      </main>
    );

  // get more info about custom call type:  https://getstream.io/video/docs/react/guides/configuring-call-types/
  const notAllowed =
    call.type === "invited" &&
    (!userInfo ||
      !call.state.members.find((m) => String(m.user.id) === String(userInfo.id)));

  if (notAllowed) {
    return (
      <main className="grid min-h-screen w-full place-items-center bg-[#080d1b] px-6 text-center text-white">
        <h1 className="text-2xl font-semibold">Not allowed</h1>
      </main>
    );
  }

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

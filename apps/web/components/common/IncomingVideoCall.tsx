import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import React, { useEffect, useState } from "react";
import { IncomingChatCallSurface } from "@/features/chat/components/Call/YomeCallUI";

function IncomingVideoCall() {
  const [{ incomingVideoCall, socket }, dispatch] = useStateProvider();
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  if (!incomingVideoCall) return null;

  useEffect(() => {
    const audio = new Audio("/call-sound.mp3");
    audio.loop = true;
    setAudioElement(audio);
  }, []);

  useEffect(() => {
    if (audioElement) {
      audioElement.play();

      return () => {
        audioElement.pause();
        audioElement.currentTime = 0;
      };
    }
  }, [audioElement]);

  const acceptCall = (acceptAsVideo: boolean) => {
    const call = incomingVideoCall;
    dispatch({
      type: reducerCases.SET_VIDEO_CALL,
      videoCall: { ...call, type: "in-coming", callType: acceptAsVideo ? "video" : "audio" },
    });
    dispatch({
      type: reducerCases.SET_INCOMING_VIDEO_CALL,
      incomingVideoCall: undefined,
    });
    socket?.current?.emit("accept-incoming-call", { id: incomingVideoCall.id });
  };

  const rejectCall = () => {
    const call = incomingVideoCall;
    dispatch({
      type: reducerCases.SET_INCOMING_VIDEO_CALL,
      incomingVideoCall: undefined,
    });
    socket?.current?.emit("reject-video-call", {
      from: call.id,
    });
  };

  return (
    <IncomingChatCallSurface
      call={incomingVideoCall}
      videoEnabled={videoEnabled}
      onToggleVideo={() => setVideoEnabled((value) => !value)}
      onAccept={acceptCall}
      onDecline={rejectCall}
    />
  );
}

export default IncomingVideoCall;

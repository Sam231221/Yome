import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import React, { useEffect, useState } from "react";
import { IncomingChatCallSurface } from "@/features/chat/components/Call/YomeCallUI";

function IncomingCall() {
  const [{ incomingVoiceCall, socket }, dispatch] = useStateProvider();
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(false);
  if (!incomingVoiceCall) return null;

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
    const call = incomingVoiceCall;
    dispatch({
      type: reducerCases.SET_INCOMING_VOICE_CALL,
      incomingVoiceCall: undefined,
    });
    if (acceptAsVideo) {
      dispatch({
        type: reducerCases.SET_VIDEO_CALL,
        videoCall: { ...call, type: "in-coming", callType: "video" },
      });
    } else {
      dispatch({
        type: reducerCases.SET_VOICE_CALL,
        voiceCall: { ...call, type: "in-coming", callType: "audio" },
      });
    }
    socket?.current?.emit("accept-incoming-call", { id: incomingVoiceCall.id });
  };

  const rejectCall = () => {
    const call = incomingVoiceCall;
    dispatch({
      type: reducerCases.SET_INCOMING_VOICE_CALL,
      incomingVoiceCall: undefined,
    });
    socket?.current?.emit("reject-voice-call", {
      from: call.id,
    });
  };

  return (
    <IncomingChatCallSurface
      call={incomingVoiceCall}
      videoEnabled={videoEnabled}
      onToggleVideo={() => setVideoEnabled((value) => !value)}
      onAccept={acceptCall}
      onDecline={rejectCall}
    />
  );
}

export default IncomingCall;

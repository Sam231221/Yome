import axios from "axios";
import React, { useEffect, useState } from "react";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import { GET_CALL_TOKEN } from "@/utils/ApiRoutes";
import type { ActiveCall } from "@/types/chat";
import toast from "react-hot-toast";
import { ActiveChatCallSurface } from "./YomeCallUI";

type ZegoCallClient = {
  destroyStream: (stream: MediaStream) => void;
  stopPublishingStream: (streamId: string) => void;
  logoutRoom: (roomId: string) => void;
};

function Container({ data }: { data: ActiveCall }) {
  const [{ socket, userInfo }, dispatch] = useStateProvider();
  const [localStream, setLocalStream] = useState<MediaStream | undefined>(
    undefined
  );
  const [publishStream, setPublishStream] = useState<string | undefined>(
    undefined
  );
  const [token, setToken] = useState<string | undefined>(undefined);
  const [zgVar, setZgVar] = useState<ZegoCallClient | undefined>(undefined);
  const [callStarted, setCallStarted] = useState(false);
  const [callAccepted, setcallAccepted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [camera, setCamera] = useState(data.callType === "video");
  const [handRaised, setHandRaised] = useState(false);
  useEffect(() => {
    if (data.type === "out-going" && socket?.current) {
      socket.current.on("accept-call", () => setcallAccepted(true));
    } else {
      setTimeout(() => {
        setcallAccepted(true);
      }, 1000);
    }
  }, [data, socket]);

  useEffect(() => {
    const getToken = async () => {
      try {
        if (!userInfo?.id) return;
        const {
          data: { token },
        } = await axios.get(`${GET_CALL_TOKEN}/${userInfo.id}`);
        setToken(token);
      } catch {
        toast.error("Failed to prepare call session.");
      }
    };
    if (callAccepted) {
      getToken();
    }
  }, [callAccepted, userInfo?.id]);

  useEffect(() => {
    const startCall = async () => {};
    if (token && !callStarted) {
      startCall();
      setCallStarted(true);
    }
  }, [token]);

  const endCall = () => {
    const id = data.id;
    socket?.current?.emit(data.callType === "video" ? "reject-video-call" : "reject-voice-call", {
      from: id,
    });
    if (zgVar && localStream && publishStream && typeof data.roomId === "number") {
      zgVar.destroyStream(localStream);
      zgVar.stopPublishingStream(publishStream);
      zgVar.logoutRoom(data.roomId.toString());
    }
    dispatch({ type: reducerCases.END_CALL });
  };

  return (
    <ActiveChatCallSurface
      call={data}
      mode={data.callType === "video" ? "video" : "audio"}
      callAccepted={callAccepted}
      muted={muted}
      onToggleMute={() => setMuted((value) => !value)}
      onEnd={endCall}
      speaker={speaker}
      onToggleSpeaker={() => setSpeaker((value) => !value)}
      onSwitchToVideo={() => {
        dispatch({
          type: reducerCases.SET_VIDEO_CALL,
          videoCall: { ...data, callType: "video" },
        });
        dispatch({
          type: reducerCases.SET_VOICE_CALL,
          voiceCall: undefined,
        });
        setCamera(true);
      }}
      camera={camera}
      onToggleCamera={() => setCamera((value) => !value)}
      handRaised={handRaised}
      onToggleHand={() => setHandRaised((value) => !value)}
    />
  );
}

export default Container;

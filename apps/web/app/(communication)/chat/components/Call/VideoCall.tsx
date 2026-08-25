import React, { useEffect } from "react";
import dynamic from "next/dynamic";
const Container = dynamic(() => import("./Container"), {
  ssr: false,
});

import { useStateProvider } from "@/context/StateContext";

function VideoCall() {
  const [{ videoCall, socket, userInfo }] = useStateProvider();

  useEffect(() => {
    if (
      videoCall?.type === "out-going" &&
      socket?.current &&
      userInfo &&
      typeof videoCall.roomId === "number"
    ) {
      socket.current.emit("outgoing-video-call", {
        to: videoCall.id,
        from: {
          id: userInfo.id,
          profilePicture: userInfo.profilePicture,
          name: userInfo.name,
        },
        callType: videoCall.callType,
        roomId: videoCall.roomId,
      });
    }
  }, [socket, userInfo, videoCall]);

  if (!videoCall) return null;

  return <Container data={videoCall} />;
}

export default VideoCall;

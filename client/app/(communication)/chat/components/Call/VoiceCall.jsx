import React, { useEffect } from "react";

import { useStateProvider } from "@/context/StateContext";
import dynamic from "next/dynamic";
/*
The Container component is imported dynamically using dynamic from @/components/Call/Container. 
This allows for lazy-loading the Container component when needed.
{ ssr: false } as the second argument to dynamic indicates that this component should not be server-side rendered.
*/
const Container = dynamic(() => import("./Container"), {
  ssr: false,
});

function VoiceCall() {
  const [{ voiceCall, socket, userInfo }] = useStateProvider();

  useEffect(() => {
    if (voiceCall.type === "out-going") {
      socket.current.emit("outgoing-voice-call", {
        to: voiceCall.id,
        from: {
          id: userInfo.id,
          profilePicture: userInfo.profileImage,
          name: userInfo.name,
        },
        callType: voiceCall.callType,
        roomId: voiceCall.roomId,
      });
    }
  }, [voiceCall]);
  return <Container data={voiceCall} />;
}

export default VoiceCall;

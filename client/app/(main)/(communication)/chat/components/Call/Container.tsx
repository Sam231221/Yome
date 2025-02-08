import axios from "axios";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { MdOutlineCallEnd } from "react-icons/md";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import { GET_CALL_TOKEN } from "@/utils/ApiRoutes";
function Container({ data }) {
  const [{ socket, userInfo }, dispatch] = useStateProvider();
  const [localStream, setLocalStream] = useState(undefined);
  const [publishStream, setPublishStream] = useState(undefined);
  const [token, setToken] = useState(undefined);
  const [zgVar, setZgVar] = useState(undefined);
  const [callStarted, setCallStarted] = useState(false);
  const [callAccepted, setcallAccepted] = useState(false);
  console.log("daaa:", data);
  useEffect(() => {
    if (data.type === "out-going")
      socket.current.on("accept-call", () => setcallAccepted(true));
    else {
      setTimeout(() => {
        setcallAccepted(true);
      }, 1000);
    }
  }, [data]);

  useEffect(() => {
    const getToken = async () => {
      try {
        const {
          data: { token },
        } = await axios.get(`${GET_CALL_TOKEN}/${userInfo.id}`);
        setToken(token);
      } catch (err) {
        console.log(err);
      }
    };
    if (callAccepted) {
      getToken();
    }
  }, [callAccepted]);

  useEffect(() => {
    const startCall = async () => {};
    if (token && !callStarted) {
      startCall();
      setCallStarted(true);
    }
  }, [token]);

  const endCall = () => {
    const id = data.id;
    socket.current.emit("reject-voice-call", {
      from: id,
    });
    if (zgVar && localStream && publishStream) {
      zgVar.destroyStream(localStream);
      zgVar.stopPublishingStream(publishStream);
      zgVar.logoutRoom(data.roomId.toString());
    }
    dispatch({ type: reducerCases.END_CALL });
  };

  return (
    <div className="border-conversation-border border-l w-full bg-conversation-panel-background flex flex-col h-[100vh] overflow-hidden items-center justify-center  ">
      <div className="flex flex-col gap-3 items-center">
        <span className="text-5xl text-gray-700 font-bold">{data.name}</span>
        <span className="text-lg">
          {callAccepted && data.callType !== "video"
            ? "On going call"
            : "Calling"}
        </span>
      </div>
      {(!callAccepted || data.callType === "audio") && (
        <div className="my-10">
          <Image
            src={data?.profilePicture || "/avatars/userprofile.png"}
            alt="avatar"
            height={200}
            width={200}
            className="rounded-full"
          />
        </div>
      )}
      <div className="my-5 relative" id="remote-video">
        <div className="absolute bottom-5 right-5" id="local-video"></div>
      </div>

      <div
        className="rounded-full h-16 w-16 bg-red-600 flex items-center justify-center"
        onClick={endCall}
      >
        <MdOutlineCallEnd className="text-3xl text-white cursor-pointer" />
      </div>
    </div>
  );
}

export default Container;

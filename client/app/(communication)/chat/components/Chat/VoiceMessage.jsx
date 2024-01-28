import { useStateProvider } from "@/context/StateContext";
import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import Avatar from "@/components/common/Avatar";
import { FaPlay, FaStop } from "react-icons/fa";
import { HOST } from "@/utils/ApiRoutes";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "@/components/common/MessageStatus";

function VoiceMessage({ message }) {
  const [{ currentChatUser, userInfo }] = useStateProvider();
  const [audioMessage, setAudioMessage] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformReady, setWaveformReady] = useState(false);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const waveformRef = useRef(null);
  const waveform = useRef(null);

  useEffect(() => {
    if (waveform.current === null) {
      waveform.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#131313",
        progressColor: "#000000",
        cursorColor: "#7ae3c3",
        barWidth: 2,
        height: 30,
        responsive: true,
      });
      waveform.current.on("finish", () => {
        setIsPlaying(false);
      });
    }
    return () => {
      waveform.current.destroy();
    };
  }, []);

  useEffect(() => {
    const audioURL = `${message.message}`;
    const audio = new Audio(audioURL);
    setAudioMessage(audio);
    setWaveformReady(true);
    waveform.current.load(audioURL);
    waveform.current.on("ready", () => {
      setTotalDuration(waveform.current.getDuration());
    });
  }, [message.message]);

  const handlePlayAudio = () => {
    if (audioMessage) {
      waveform.current.stop();
      waveform.current.play();
      audioMessage.play();
      setIsPlaying(true);
    }
  };

  const handlePauseAudio = () => {
    if (audioMessage) {
      waveform.current.stop();
      audioMessage.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (audioMessage) {
      const updatePlaybackTime = () => {
        setCurrentPlaybackTime(audioMessage.currentTime);
      };
      audioMessage.addEventListener("timeupdate", updatePlaybackTime);
      return () => {
        audioMessage.removeEventListener("timeupdate", updatePlaybackTime);
      };
    }
  }, [audioMessage]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div
      className={`flex items-center gap-5 text-gray-800  px-4 pr-2 py-4 text-sm rounded-md   
       ${
         message.senderId === currentChatUser.id
           ? "bg-incoming-background"
           : "bg-outgoing-background"
       }`}
    >
      <div>
        <Avatar
          type="sm"
          image={
            message.senderId === currentChatUser.id
              ? currentChatUser?.profilePicture || "/avatars/userprofile.png"
              : userInfo?.profilePicture || "/avatars/userprofile.png"
          }
        />
      </div>
      <div className="cursor-pointer text-xl">
        {!isPlaying ? (
          <FaPlay
            className={` ${
              message.senderId === currentChatUser.id
                ? "text-black"
                : "text-white"
            }  text-sm font-medium`}
            onClick={handlePlayAudio}
          />
        ) : (
          <FaStop
            className={` ${
              message.senderId === currentChatUser.id
                ? "text-black"
                : "text-white"
            }  text-sm font-medium`}
            onClick={handlePauseAudio}
          />
        )}
      </div>
      <div className="relative">
        <div className="w-32 xs:w-40 sm:w-40 lg:w-60" ref={waveformRef} />
        <div className="text-gray-800 text-[11px] pt-1  flex justify-between absolute bottom-[-22px] w-full ">
          <span
            className={` ${
              message.senderId === currentChatUser.id
                ? "text-black"
                : "text-white"
            }  text-sm font-medium`}
          >
            {formatTime(isPlaying ? currentPlaybackTime : totalDuration)}
          </span>
          <div className="flex gap-1">
            <span
              className={` ${
                message.senderId === currentChatUser.id
                  ? "text-gray-800"
                  : "text-white"
              }  text-[9px] min-w-fit`}
            >
              {calculateTime(message.createdAt)}
            </span>
            {message.senderId === userInfo.id && (
              <MessageStatus messageStatus={message.messageStatus} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceMessage;

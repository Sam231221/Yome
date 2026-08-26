import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import toast from "react-hot-toast";

import React, { useState, useRef, useEffect } from "react";
import {
  FaMicrophone,
  FaPauseCircle,
  FaPlay,
  FaStop,
  FaTrash,
} from "react-icons/fa";
import { MdSend } from "react-icons/md";
import WaveSurfer from "wavesurfer.js";
import type { ChatKind, ChatMessage } from "@/types/chat";
import { getChatErrorMessage, sendAudioMessage } from "@/lib/chat/chatApi";

type AudioRecorderProps = {
  hide?: React.Dispatch<React.SetStateAction<boolean>>;
  chatType?: string;
};

const AudioRecorder = ({ hide, chatType }: AudioRecorderProps) => {
  const [{ userInfo, currentChatUser, socket }, dispatch] = useStateProvider();
  const resolvedChatType = (chatType === "group" ? "group" : "user") as ChatKind;
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  const [waveform, setWaveform] = useState<WaveSurfer | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<HTMLAudioElement | null>(
    null
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prevDuration) => {
          setTotalDuration(prevDuration + 1);
          return prevDuration + 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isRecording]);

  useEffect(() => {
    const container = waveformRef.current;
    if (!container) return;
    const wavesurfer = WaveSurfer.create({
      container,
      waveColor: "#ccc",
      progressColor: "#4a9eff",
      cursorColor: "#7ae3c3",
      barWidth: 2,
      height: 30,
    });
    setWaveform(wavesurfer);

    wavesurfer.on("finish", () => {
      setIsPlaying(false);
    });

    return () => {
      wavesurfer.destroy();
    };
  }, []);

  useEffect(() => {
    if (waveform) {
      handleStartRecording();
    }
  }, [waveform]);

  const handleStartRecording = () => {
    setRecordingDuration(0);
    setCurrentPlaybackTime(0);
    setTotalDuration(0);

    setIsRecording(true);

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        if (audioRef.current) audioRef.current.srcObject = stream;

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) =>
          e.data.size > 0 && chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
          const audioURL = URL.createObjectURL(blob);
          const audio = new Audio(audioURL);
          setRecordedAudio(audio);

          waveform?.load(audioURL);
        };

        mediaRecorder.start();
      })
      .catch((error) => {
        setIsRecording(false);
        toast.error(getChatErrorMessage(error, "Unable to access microphone."));
        hide?.(false);
      });
  };

  const [renderedAudio, setRenderedAudio] = useState<File | null>(null);

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      waveform?.stop();

      const audioChunks: Blob[] = [];
      mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      });

      mediaRecorderRef.current.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
        const audioFile = new File([audioBlob], "recording.mp3");
        setRenderedAudio(audioFile);
      });
    }
  };

  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayRecordedAudio = () => {
    if (recordedAudio) {
      waveform?.stop();
      waveform?.play();
      recordedAudio.play();
      setIsPlaying(true);
    }
  };

  const handlePauseRecordingAudio = () => {
    waveform?.stop();
    recordedAudio?.pause();
    setIsPlaying(false);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    if (recordedAudio) {
      const updatePlaybackTime = () => {
        setCurrentPlaybackTime(recordedAudio.currentTime);
      };
      recordedAudio.addEventListener("timeupdate", updatePlaybackTime);
      return () => {
        recordedAudio.removeEventListener("timeupdate", updatePlaybackTime);
      };
    }
  }, [recordedAudio]);

  const appendMessage = (messagePayload: ChatMessage) => {
    if (!currentChatUser?.id) return;

    if (resolvedChatType === "user") {
      dispatch({
        type: reducerCases.ADD_USER_MESSAGE,
        newMessage: messagePayload,
        fromSelf: true,
      });
      return;
    }

    dispatch({
      type: reducerCases.ADD_GROUP_MESSAGE,
      newMessage: messagePayload,
      groupId: currentChatUser.id,
      fromSelf: true,
    });
  };

  const sendRecording = async () => {
    if (!renderedAudio || !userInfo?.id || !currentChatUser?.id) return;
    try {
      const sentMessage = await sendAudioMessage({
        chatType: resolvedChatType,
        from: userInfo.id,
        to: currentChatUser.id,
        file: renderedAudio,
      });
      socket?.current?.emit("send-msg", {
        chatType: resolvedChatType,
        room: `room-${currentChatUser.id}`,
        to: currentChatUser.id,
        from: userInfo.id,
        message: sentMessage,
      });
      appendMessage(sentMessage);
      hide?.(false);
    } catch (error) {
      toast.error(getChatErrorMessage(error, "Failed to send audio."));
    }
  };

  return (
    <div className="flex text-2xl w-full justify-end items-center">
      <div className="pt-1">
        <FaTrash
          className="text-panel-header-icon"
          onClick={() => hide?.(false)}
        />
      </div>
      <div className="mx-4 py-2 px-4 text-white text-lg flex gap-3 justify-center items-center bg-search-input-container-background rounded-full drop-shadow-lg">
        {isRecording ? (
          <div className="text-red-500 animate-blink w-60 text-center">
            Recording <span>({recordingDuration}s)</span>
          </div>
        ) : (
          <div className=" ">
            {recordedAudio && (
              <>
                {!isPlaying ? (
                  <FaPlay onClick={handlePlayRecordedAudio} />
                ) : (
                  <FaStop onClick={handlePauseRecordingAudio} />
                )}
              </>
            )}
          </div>
        )}
        <div className="w-60" ref={waveformRef} hidden={isRecording} />
        {recordedAudio && isPlaying && (
          <span>{formatTime(currentPlaybackTime)}</span>
        )}
        {recordedAudio && !isPlaying && (
          <span>{formatTime(totalDuration)}</span>
        )}
        <audio ref={audioRef} hidden />
      </div>

      <div className="mr-4 ">
        {!isRecording ? (
          <FaMicrophone
            className="text-red-500"
            onClick={handleStartRecording}
          />
        ) : (
          <FaPauseCircle
            className="text-red-500"
            onClick={handleStopRecording}
          />
        )}
      </div>
      <div>
        <MdSend
          className="text-panel-header-icon cursor-pointer mr-4 "
          title="Send"
          onClick={sendRecording}
        />
      </div>
    </div>
  );
};

export default AudioRecorder;

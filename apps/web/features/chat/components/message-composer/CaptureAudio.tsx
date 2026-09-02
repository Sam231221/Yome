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
import {
  isGroupId,
  type ChatKind,
  type ChatMessage,
} from "@/features/chat/types";
import { getChatErrorMessage, sendAudioMessage } from "@/features/chat/api/chatApi";

const AUDIO_RECORDING_MIME_CANDIDATES = [
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/webm;codecs=opus",
  "audio/webm",
] as const;

const getSupportedRecordingMimeType = () => {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "";
  }

  for (const mimeType of AUDIO_RECORDING_MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return "";
};

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
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const pendingSendRef = useRef(false);

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

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleStartRecording = () => {
    if (isRecording || mediaRecorderRef.current?.state === "recording") {
      return;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    audioChunksRef.current = [];
    setRecordedAudio(null);
    setRenderedAudio(null);
    setRecordingDuration(0);
    setCurrentPlaybackTime(0);
    setTotalDuration(0);

    setIsRecording(true);

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const preferredMimeType = getSupportedRecordingMimeType();
        const mediaRecorder = preferredMimeType
          ? new MediaRecorder(stream, { mimeType: preferredMimeType })
          : new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        mediaStreamRef.current = stream;
        if (audioRef.current) audioRef.current.srcObject = stream;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const mimeType = mediaRecorder.mimeType || "audio/webm";
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          const extension = mimeType.includes("ogg")
            ? "ogg"
            : mimeType.includes("mp4") || mimeType.includes("m4a")
              ? "m4a"
            : mimeType.includes("mp3")
              ? "mp3"
              : mimeType.includes("wav")
                ? "wav"
              : "webm";
          const audioFile = new File([blob], `recording.${extension}`, {
            type: mimeType,
          });
          const audioURL = URL.createObjectURL(blob);
          audioUrlRef.current = audioURL;
          const audio = new Audio(audioURL);

          audio.addEventListener(
            "loadedmetadata",
            () => {
              setTotalDuration(audio.duration || recordingDuration);
            },
            { once: true }
          );

          setRecordedAudio(audio);
          setRenderedAudio(audioFile);
          setTotalDuration(recordingDuration);

          waveform?.load(audioURL);
          mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
          mediaRecorderRef.current = null;

          if (pendingSendRef.current) {
            pendingSendRef.current = false;
            void uploadAndSendRecording(audioFile).catch((error) => {
              toast.error(getChatErrorMessage(error, "Failed to send audio."));
            });
          }
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

  const uploadAndSendRecording = async (audioFile: File) => {
    if (!userInfo?.id || !currentChatUser?.id) return;

    const sentMessage = await sendAudioMessage({
      chatType: resolvedChatType,
      from: userInfo.id,
      to: currentChatUser.id,
      file: audioFile,
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
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording" && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      waveform?.stop();
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
      groupId: isGroupId(currentChatUser.id) ? currentChatUser.id : undefined,
      fromSelf: true,
    });
  };

  const sendRecording = async () => {
    if (!userInfo?.id || !currentChatUser?.id) return;

    if (isRecording) {
      pendingSendRef.current = true;
      handleStopRecording();
      return;
    }

    if (!renderedAudio) {
      toast.error("Record audio before sending.");
      return;
    }

    try {
      await uploadAndSendRecording(renderedAudio);
    } catch (error) {
      toast.error(getChatErrorMessage(error, "Failed to send audio."));
    }
  };

  return (
    <div className="audio-recorder-shell">
      <button
        type="button"
        className="composer-icon-button"
        onClick={() => hide?.(false)}
        aria-label="Discard recording"
      >
        <FaTrash />
      </button>
      <div className="audio-recorder-panel">
        {isRecording ? (
          <div className="audio-recorder-status">
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
        <div className="audio-recorder-wave" ref={waveformRef} hidden={isRecording} />
        {recordedAudio && isPlaying && (
          <span>{formatTime(currentPlaybackTime)}</span>
        )}
        {recordedAudio && !isPlaying && (
          <span>{formatTime(totalDuration)}</span>
        )}
        <audio ref={audioRef} hidden />
      </div>

      <div>
        {!isRecording ? (
          <FaMicrophone
            className="audio-recorder-action"
            onClick={handleStartRecording}
          />
        ) : (
          <FaPauseCircle
            className="audio-recorder-action"
            onClick={handleStopRecording}
          />
        )}
      </div>
      <div className="ml-auto">
        <MdSend
          className={`audio-recorder-send ${
            renderedAudio
              ? "is-ready"
              : "is-disabled"
          }`}
          title="Send"
          onClick={sendRecording}
        />
      </div>
    </div>
  );
};

export default AudioRecorder;

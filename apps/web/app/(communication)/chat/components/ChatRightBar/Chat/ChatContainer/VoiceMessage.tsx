import { useStateProvider } from "@/context/StateContext";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaPlay, FaStop } from "react-icons/fa";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "@/components/common/MessageStatus";
import type { ChatMessage } from "@/types/chat";

interface VoiceMessageProps {
  message: ChatMessage;
}

const formatTime = (time: number) => {
  if (!Number.isFinite(time) || time < 0) {
    return "00:00";
  }

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

const WAVEFORM_BARS = [10, 18, 14, 24, 12, 20, 28, 16, 22, 12, 26, 18, 14, 24];

function VoiceMessage({ message }: VoiceMessageProps) {
  const [{ currentChatUser, userInfo }] = useStateProvider();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const audioUrl = String(message.message ?? "").trim();

  const progressPercent = useMemo(() => {
    if (!totalDuration || !Number.isFinite(totalDuration)) {
      return 0;
    }

    return Math.min((currentPlaybackTime / totalDuration) * 100, 100);
  }, [currentPlaybackTime, totalDuration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setTotalDuration(audio.duration || 0);
    };
    const handleTimeUpdate = () => {
      setCurrentPlaybackTime(audio.currentTime);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentPlaybackTime(0);
      audio.currentTime = 0;
    };
    const handlePause = () => {
      setIsPlaying(false);
    };
    const handlePlay = () => {
      setIsPlaying(true);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.src = audioUrl;
    audio.load();
    setIsPlaying(false);
    setCurrentPlaybackTime(0);
    setTotalDuration(0);
  }, [audioUrl]);

  const handlePlayAudio = async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    try {
      await audio.play();
    } catch {
      setIsPlaying(false);
    }
  };

  const handlePauseAudio = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  if (!currentChatUser || !userInfo) return null;

  const isOwnMessage = message.senderId === userInfo.id;

  return (
    <div className={`chat-message voice-message ${isOwnMessage ? "mine" : ""}`}>
      <audio ref={audioRef} preload="metadata" className="hidden" />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={isPlaying ? handlePauseAudio : () => void handlePlayAudio()}
          className="voice-message-button"
          aria-label={isPlaying ? "Pause audio message" : "Play audio message"}
          disabled={!audioUrl}
        >
          {isPlaying ? (
            <FaStop className="text-sm" />
          ) : (
            <FaPlay className="text-sm ml-0.5" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex h-9 items-end gap-[3px] overflow-hidden">
            {WAVEFORM_BARS.map((height, index) => {
              const threshold = ((index + 1) / WAVEFORM_BARS.length) * 100;
              const isActive = progressPercent >= threshold;

              return (
                <span
                  key={`${message.id}-wave-${index}`}
                  className={`voice-message-bar ${isActive ? "active" : ""}`}
                  style={{
                    height: `${Math.max(8, Math.round(height * 0.72))}px`,
                    opacity: isActive ? 1 : 0.92,
                  }}
                />
              );
            })}
          </div>
          <div className="chat-message-meta mt-1.5">
            <span className="text-[12px] font-semibold tabular-nums">
              {formatTime(isPlaying ? currentPlaybackTime : totalDuration)}
            </span>
            <div className="flex items-center gap-1.5">
              <span>{calculateTime(String(message.createdAt))}</span>
              {isOwnMessage && <MessageStatus messageStatus={message.messageStatus} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceMessage;

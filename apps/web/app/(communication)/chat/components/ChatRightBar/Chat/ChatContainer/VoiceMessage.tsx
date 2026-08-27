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
  const bubbleClass = isOwnMessage
    ? "bg-[#2F80ED] text-white shadow-[0_10px_24px_rgba(47,128,237,0.24)]"
    : "bg-white text-[#111827] border border-[#E5E7EB] shadow-[0_10px_24px_rgba(15,23,42,0.06)]";
  const secondaryTextClass = isOwnMessage ? "text-blue-100/95" : "text-[#6B7280]";
  const buttonClass = isOwnMessage
    ? "bg-white/16 hover:bg-white/22"
    : "bg-[#EFF4FF] hover:bg-[#E4EDFF]";
  const iconClass = isOwnMessage ? "text-white" : "text-[#2563EB]";
  const inactiveBarClass = isOwnMessage ? "bg-white/28" : "bg-[#D7DFEC]";
  const activeBarClass = isOwnMessage ? "bg-white" : "bg-[#2563EB]";

  return (
    <div
      className={`px-3 py-2.5 rounded-[22px] max-w-[280px] sm:max-w-[320px] min-w-[220px] ${bubbleClass}`}
    >
      <audio ref={audioRef} preload="metadata" className="hidden" />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={isPlaying ? handlePauseAudio : () => void handlePlayAudio()}
          className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${buttonClass}`}
          aria-label={isPlaying ? "Pause audio message" : "Play audio message"}
          disabled={!audioUrl}
        >
          {isPlaying ? (
            <FaStop className={`${iconClass} text-sm`} />
          ) : (
            <FaPlay className={`${iconClass} text-sm ml-0.5`} />
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
                  className={`block w-1.5 rounded-full transition-all duration-150 ${
                    isActive ? activeBarClass : inactiveBarClass
                  }`}
                  style={{
                    height: `${Math.max(8, Math.round(height * 0.72))}px`,
                    opacity: isActive ? 1 : 0.92,
                  }}
                />
              );
            })}
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <span className={`text-[12px] font-semibold tabular-nums ${secondaryTextClass}`}>
              {formatTime(isPlaying ? currentPlaybackTime : totalDuration)}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] ${secondaryTextClass}`}>
                {calculateTime(String(message.createdAt))}
              </span>
              {isOwnMessage && (
                <MessageStatus messageStatus={message.messageStatus} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceMessage;

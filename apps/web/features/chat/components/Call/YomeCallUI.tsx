"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import {
  ChevronLeft,
  Headphones,
  MessageCircle,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  Phone,
  Users,
  Video,
  VideoOff,
} from "lucide-react";

import type { ActiveCall } from "@/types/chat";

type ControlProps = {
  icon: ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
};

type CallAvatarProps = {
  call: ActiveCall;
  initials?: string;
};

type IncomingSurfaceProps = {
  call: ActiveCall;
  videoEnabled: boolean;
  onToggleVideo: () => void;
  onAccept: (videoEnabled: boolean) => void;
  onDecline: () => void;
};

type ActiveSurfaceProps = {
  call: ActiveCall;
  mode: "audio" | "video";
  callAccepted: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onEnd: () => void;
  speaker?: boolean;
  onToggleSpeaker?: () => void;
  onSwitchToVideo?: () => void;
  camera?: boolean;
  onToggleCamera?: () => void;
  handRaised?: boolean;
  onToggleHand?: () => void;
};

const toneNames = ["blue", "violet", "teal", "amber"] as const;

const getInitials = (name?: string) =>
  (name ?? "Unknown caller")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "YC";

const getTone = (name?: string) => {
  const source = name ?? "";
  const total = source.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return toneNames[total % toneNames.length];
};

export function ChatCallControl({
  icon,
  label,
  active = false,
  danger = false,
  onClick,
}: ControlProps) {
  return (
    <button className={`call-control${active ? " active" : ""}${danger ? " danger" : ""}`} onClick={onClick} type="button">
      <span>{icon}</span>
      <small>{label}</small>
    </button>
  );
}

export function ChatCallAvatar({ call, initials }: CallAvatarProps) {
  const label = initials ?? getInitials(call.name);
  const tone = getTone(call.name);

  return (
    <div className={`avatar avatar-${tone} avatar-call`}>
      {call.profilePicture ? (
        <Image
          fill
          src={call.profilePicture}
          alt={call.name ?? "Caller"}
          sizes="120px"
          className="call-avatar-image"
        />
      ) : (
        label
      )}
    </div>
  );
}

export function IncomingChatCallSurface({
  call,
  videoEnabled,
  onToggleVideo,
  onAccept,
  onDecline,
}: IncomingSurfaceProps) {
  return (
    <main className="incoming-call-page chat-call-page">
      <div className="call-backdrop"><span /><span /><span /></div>
      <div className="incoming-call-card">
        <div className="incoming-label">
          <span className="live-dot" /> Incoming {videoEnabled ? "video" : "audio"} call
        </div>
        <ChatCallAvatar call={call} />
        <h1>{call.name ?? "Unknown caller"}</h1>
        <p>Calling from your conversation</p>
        <div className="incoming-context">
          <MessageCircle size={17} />
          <span>Answer in chat without leaving the thread</span>
        </div>
        <div className="incoming-actions">
          <ChatCallControl icon={<Phone size={20} />} label="Decline" danger onClick={onDecline} />
          <ChatCallControl
            icon={videoEnabled ? <VideoOff size={20} /> : <Video size={20} />}
            label={videoEnabled ? "Video off" : "Video on"}
            active={videoEnabled}
            onClick={onToggleVideo}
          />
          <ChatCallControl icon={<Phone size={20} />} label="Accept" onClick={() => onAccept(videoEnabled)} />
        </div>
        <button className="incoming-message" onClick={onDecline} type="button">Reply with a message</button>
      </div>
    </main>
  );
}

export function ActiveChatCallSurface({
  call,
  mode,
  callAccepted,
  muted,
  onToggleMute,
  onEnd,
  speaker = true,
  onToggleSpeaker,
  onSwitchToVideo,
  camera = true,
  onToggleCamera,
  handRaised = false,
  onToggleHand,
}: ActiveSurfaceProps) {
  if (mode === "audio") {
    return (
      <main className="audio-call-page chat-call-page">
        <div className="call-top">
          <div className="mini-brand"><span>Y</span> yome call</div>
          <button onClick={onEnd} type="button">
            <ChevronLeft size={16} />
            Back to messages
          </button>
        </div>
        <section className="audio-call-main">
          <div className="audio-orbits"><i /><i /><i /></div>
          <ChatCallAvatar call={call} />
          <h1>{call.name ?? "Unknown caller"}</h1>
          <p>{callAccepted ? "00:08:42" : "Calling..."}</p>
          <span className="call-quality"><i className="live-dot" /> Encrypted · Good connection</span>
          <div className="audio-wave">
            {Array.from({ length: 28 }).map((_, index) => (
              <i key={index} style={{ height: `${8 + (index % 7) * 4}px` }} />
            ))}
          </div>
        </section>
        <footer className="call-dock">
          <ChatCallControl icon={muted ? <MicOff size={20} /> : <Mic size={20} />} label={muted ? "Unmute" : "Mute"} active={muted} onClick={onToggleMute} />
          <ChatCallControl icon={<Headphones size={20} />} label={speaker ? "Speaker on" : "Speaker off"} active={!speaker} onClick={onToggleSpeaker} />
          <ChatCallControl icon={<Users size={20} />} label="Add person" />
          <ChatCallControl icon={<Video size={20} />} label="Switch to video" onClick={onSwitchToVideo} />
          <ChatCallControl icon={<Phone size={20} />} label="End call" danger onClick={onEnd} />
        </footer>
      </main>
    );
  }
  const remoteName = call.name ?? "Unknown caller";
  const remoteInitials = getInitials(remoteName);
  const remoteTone = getTone(remoteName);

  return (
    <main className="video-call-page chat-call-page chat-direct-video-page">
      <header>
        <div>
          <span className="live-dot" />
          <strong>{remoteName}</strong>
          <small>{callAccepted ? "1:1 video call · Good connection" : "Connecting video call"}</small>
        </div>
        <button type="button" aria-label="More options">
          <MoreHorizontal size={18} />
        </button>
      </header>
      <section className="chat-direct-video-stage">
        <article className="video-tile speaking chat-direct-video-hero">
          <div className={`video-person video-${remoteTone}`}>
            {call.profilePicture ? (
              <div className="chat-direct-video-photo">
                <Image
                  fill
                  src={call.profilePicture}
                  alt={remoteName}
                  sizes="640px"
                  className="call-avatar-image"
                />
              </div>
            ) : (
              <>
                <span className="video-avatar-face">{remoteInitials}</span>
                <div className="video-abstract"><i /><i /><i /></div>
              </>
            )}
          </div>
          <footer>
            <span><i className="live-dot" /><strong>{remoteName}</strong></span>
          </footer>
        </article>
        <article className="video-tile chat-self-preview">
          <div className="video-person video-violet">
            {camera ? (
              <>
                <span className="video-avatar-face">YO</span>
                <div className="video-abstract"><i /><i /><i /></div>
              </>
            ) : (
              <span className="video-avatar-face">YO</span>
            )}
          </div>
          <footer>
            <span><strong>You</strong></span>
            {muted ? <MicOff size={14} /> : null}
          </footer>
        </article>
        <div className="chat-direct-video-meta">
          <span className="call-quality"><i className="live-dot" /> Encrypted · {callAccepted ? "Live now" : "Connecting"}</span>
        </div>
      </section>
      <footer className="video-call-dock">
        <div>
          <ChatCallControl icon={muted ? <MicOff size={20} /> : <Mic size={20} />} label={muted ? "Unmute" : "Mute"} active={muted} onClick={onToggleMute} />
          <ChatCallControl icon={camera ? <Video size={20} /> : <VideoOff size={20} />} label={camera ? "Stop video" : "Start video"} active={!camera} onClick={onToggleCamera} />
          <ChatCallControl icon={<MonitorUp size={20} />} label="Share screen" />
          <ChatCallControl icon={<Users size={20} />} label={handRaised ? "Hand raised" : "Raise hand"} active={handRaised} onClick={onToggleHand} />
          <ChatCallControl icon={<MessageCircle size={20} />} label="Chat" />
          <ChatCallControl icon={<Phone size={20} />} label="End" danger onClick={onEnd} />
        </div>
      </footer>
    </main>
  );
}

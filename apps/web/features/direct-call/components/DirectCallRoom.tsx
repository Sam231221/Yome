"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CallingState,
  ParticipantView,
  ParticipantsAudio,
  useCall,
  useCallStateHooks,
  type StreamVideoParticipant,
} from "@stream-io/video-react-sdk";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  RefreshCw,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/features/auth/providers/AuthStateProvider";
import { buildDirectCallDescriptor } from "@/features/direct-call/lib/guards";
import { consumeDirectCallAutoJoinIntent } from "@/features/direct-call/lib/storage";
import type { DirectCallMode } from "@/features/direct-call/types";
import { DirectCallErrorState, DirectCallLoadingState } from "./DirectCallStates";

const OUTGOING_RING_TIMEOUT_MS = 60_000;

const getTerminalCallMessage = (reason?: string) => {
  switch (reason) {
    case "decline":
      return "The call was declined.";
    case "cancel":
      return "The call was cancelled.";
    case "timeout":
      return "No answer. The call timed out.";
    case "busy":
      return "The other person is busy on another call.";
    default:
      return "This call has ended.";
  }
};

export function DirectCallRoom({
  initialMode,
  conversationId,
}: {
  initialMode: DirectCallMode;
  conversationId: string;
}) {
  const router = useRouter();
  const [{ userInfo }] = useAuthState();
  const call = useCall();
  const activeCall = call ?? undefined;
  const joinAttemptedRef = useRef(false);
  const acceptedRef = useRef(false);
  const hadRemoteParticipantRef = useRef(false);
  const [mode, setMode] = useState<DirectCallMode>(initialMode);
  const [permissionError, setPermissionError] = useState<string>();
  const [joinError, setJoinError] = useState<string>();
  const [terminalMessage, setTerminalMessage] = useState<string>();
  const [actionPending, setActionPending] = useState(false);

  const {
    useCallCallingState,
    useRemoteParticipants,
    useLocalParticipant,
    useCameraState,
    useMicrophoneState,
  } = useCallStateHooks();

  const callingState = useCallCallingState();
  const remoteParticipants = useRemoteParticipants();
  const localParticipant = useLocalParticipant();
  const cameraState = useCameraState({ optimisticUpdates: true });
  const microphoneState = useMicrophoneState({ optimisticUpdates: true });

  const descriptor = useMemo(() => {
    if (!activeCall || !userInfo?.id) return null;
    return buildDirectCallDescriptor(activeCall, userInfo.id);
  }, [activeCall, userInfo?.id]);

  const peerDisplayName = descriptor?.peerName;

  const remoteParticipant = remoteParticipants[0];
  const primaryVideoParticipant = remoteParticipant;
  const hasRemoteParticipant = remoteParticipants.length > 0;
  const hasRemoteVideo = Boolean(remoteParticipant?.videoStream);
  const isVideoMode = mode === "video" || hasRemoteVideo;

  useEffect(() => {
    if (hasRemoteParticipant) {
      acceptedRef.current = true;
      hadRemoteParticipantRef.current = true;
      setTerminalMessage(undefined);
    }
  }, [hasRemoteParticipant]);

  const syncDevicesForMode = useCallback(async (nextMode: DirectCallMode) => {
    try {
      await microphoneState.microphone.enable();
      if (nextMode === "video") {
        await cameraState.camera.enable();
      } else {
        await cameraState.camera.disable();
      }
      setPermissionError(undefined);
      setMode(nextMode);
    } catch {
      setPermissionError(
        nextMode === "video"
          ? "Camera or microphone permission was denied."
          : "Microphone permission was denied."
      );
      throw new Error("permission-denied");
    }
  }, [cameraState.camera, microphoneState.microphone]);

  const joinCall = useCallback(async (nextMode: DirectCallMode) => {
    if (!activeCall || actionPending) return;

    joinAttemptedRef.current = true;
    setActionPending(true);
    setJoinError(undefined);

    try {
      await syncDevicesForMode(nextMode);
      await activeCall.join();
    } catch {
      try {
        await cameraState.camera.disable();
        await microphoneState.microphone.disable();
      } catch {
        // Device cleanup is best-effort after a failed join attempt.
      }
      if (activeCall.state.callingState === CallingState.RINGING) {
        try {
          await activeCall.leave({
            reject: true,
            reason: activeCall.isCreatedByMe ? "cancel" : "decline",
          });
        } catch {
          // If Stream already transitioned the call, keep the local failure visible.
        }
      }
      setJoinError("We couldn't join the call right now.");
    } finally {
      setActionPending(false);
    }
  }, [
    activeCall,
    actionPending,
    cameraState.camera,
    microphoneState.microphone,
    syncDevicesForMode,
  ]);

  useEffect(() => {
    if (!activeCall || joinAttemptedRef.current) return;
    if (callingState === CallingState.JOINED || callingState === CallingState.JOINING) {
      joinAttemptedRef.current = true;
      return;
    }

    const shouldAutoJoin =
      activeCall.isCreatedByMe || consumeDirectCallAutoJoinIntent(activeCall.id);
    if (shouldAutoJoin) {
      void joinCall(initialMode);
    }
  }, [activeCall, callingState, initialMode, joinCall]);

  useEffect(() => {
    if (!activeCall || !userInfo?.id) return;

    const offRejected = activeCall.on("call.rejected", (event) => {
      if (event.user?.id === String(userInfo.id)) return;
      if (acceptedRef.current || hadRemoteParticipantRef.current) return;
      setTerminalMessage(getTerminalCallMessage(event.reason));
    });

    const offEnded = activeCall.on("call.ended", () => {
      setTerminalMessage("This call has ended.");
    });

    const offAccepted = activeCall.on("call.accepted", () => {
      acceptedRef.current = true;
      setTerminalMessage(undefined);
    });

    const offMissed = activeCall.on("call.missed", () => {
      if (acceptedRef.current || hadRemoteParticipantRef.current) return;
      setTerminalMessage("No answer. The call was not picked up.");
    });

    return () => {
      offRejected();
      offEnded();
      offAccepted();
      offMissed();
    };
  }, [activeCall, userInfo?.id]);

  useEffect(() => {
    if (
      !activeCall ||
      !activeCall.isCreatedByMe ||
      hasRemoteParticipant ||
      acceptedRef.current
    ) {
      return;
    }
    if (callingState !== CallingState.RINGING && callingState !== CallingState.JOINED) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (acceptedRef.current || hadRemoteParticipantRef.current) return;
      setTerminalMessage("No answer. The call timed out.");
      void activeCall.leave({ reject: true, reason: "timeout" });
    }, OUTGOING_RING_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [activeCall, callingState, hasRemoteParticipant]);

  useEffect(() => {
    if (hasRemoteParticipant) {
      acceptedRef.current = true;
      hadRemoteParticipantRef.current = true;
      return;
    }

    if (
      !activeCall ||
      !hadRemoteParticipantRef.current ||
      callingState !== CallingState.JOINED
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setTerminalMessage("The other person left the call.");
      void activeCall.leave();
    }, 5_000);

    return () => window.clearTimeout(timeout);
  }, [activeCall, callingState, hasRemoteParticipant]);

  useEffect(() => {
    if (!activeCall) return;

    const leaveOnClose = () => {
      if (
        activeCall.state.callingState === CallingState.JOINED ||
        activeCall.state.callingState === CallingState.RINGING
      ) {
        void activeCall.leave({
          reject: !acceptedRef.current && !hasRemoteParticipant,
          reason:
            !acceptedRef.current && !hasRemoteParticipant ? "cancel" : undefined,
        });
      }
    };

    window.addEventListener("pagehide", leaveOnClose);
    return () => window.removeEventListener("pagehide", leaveOnClose);
  }, [activeCall, hasRemoteParticipant]);

  const handleLeave = async (reason: "leave" | "decline" | "cancel") => {
    if (!activeCall || actionPending) return;
    setActionPending(true);

    try {
      if (callingState === CallingState.RINGING || !hasRemoteParticipant) {
        await activeCall.leave({
          reject: true,
          reason: reason === "decline" ? "decline" : "cancel",
        });
      } else {
        await activeCall.leave();
      }
    } finally {
      router.replace("/chat");
    }
  };

  const handleVideoToggle = async () => {
    if (!activeCall || actionPending) return;
    setActionPending(true);

    try {
      if (cameraState.isMute) {
        await syncDevicesForMode("video");
        return;
      }

      await cameraState.camera.disable();
      if (!hasRemoteVideo) {
        setMode("audio");
      }
    } catch {
      setPermissionError("Camera permission was denied.");
    } finally {
      setActionPending(false);
    }
  };

  const handleSpeakerUnlock = async () => {
    const audioElements = Array.from(document.querySelectorAll("audio"));
    try {
      await Promise.all(
        audioElements.map((audio) => {
          audio.muted = false;
          return audio.play();
        })
      );
      setPermissionError(undefined);
    } catch {
      setPermissionError("Click Speaker again after the other person joins.");
    }
  };

  const renderTile = ({
    participant,
    compact = false,
    label,
    trackType = "videoTrack",
  }: {
    participant?: StreamVideoParticipant;
    compact?: boolean;
    label?: string;
    trackType?: "videoTrack";
  }) => {
    const participantName =
      label ?? participant?.name ?? participant?.userId ?? peerDisplayName ?? "Participant";

    if (!participant) {
      return (
        <div className="flex h-full min-h-[220px] items-center justify-center rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_40%),linear-gradient(180deg,#11182f_0%,#0a1020_100%)] p-6 text-center text-white/70">
          <div>
            <p className="text-xl font-semibold text-white">{participantName}</p>
            <p className="mt-2 text-sm text-[#96a2c1]">Waiting for video...</p>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1020] ${
          compact ? "h-full min-h-[180px]" : "h-full min-h-[320px]"
        }`}
      >
        <ParticipantView
          participant={participant}
          ParticipantViewUI={null}
          muteAudio
          trackType={trackType}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#030712]/85 via-[#030712]/25 to-transparent px-5 pb-5 pt-16">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-white">{participantName}</span>
            {participant.isLocalParticipant ? (
              <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#c7d2fe]">
                You
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
            <span className="text-xs font-medium text-[#c7d2fe]">
              {participant.isLocalParticipant ? "Camera live" : "Live video"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (!activeCall) {
    return <DirectCallLoadingState label="Preparing call..." />;
  }

  const title =
    peerDisplayName ??
    activeCall.state.createdBy?.name ??
    "Direct call";
  const subtitle =
    callingState === CallingState.RINGING && !activeCall.isCreatedByMe
      ? `Incoming ${mode} call`
      : callingState === CallingState.RINGING
        ? `${mode === "video" ? "Video" : "Audio"} call ringing`
        : callingState === CallingState.JOINED && !hasRemoteParticipant
          ? activeCall.isCreatedByMe
            ? `Waiting for ${title} to join`
            : "Waiting for the other person to join"
        : callingState === CallingState.JOINING
          ? "Joining call"
          : callingState === CallingState.RECONNECTING ||
              callingState === CallingState.MIGRATING ||
              callingState === CallingState.OFFLINE
            ? "Reconnecting"
            : "Connected";

  const showIncomingPrompt =
    callingState === CallingState.RINGING &&
    !activeCall.isCreatedByMe &&
    !joinAttemptedRef.current;
  const showEndedState =
    Boolean(terminalMessage) ||
    callingState === CallingState.LEFT ||
    callingState === CallingState.RECONNECTING_FAILED ||
    Boolean(activeCall.state.endedAt);

  if (showEndedState) {
    return (
      <DirectCallErrorState
        message={
          terminalMessage ??
          "This call has ended. Head back to messages to continue the conversation."
        }
      />
    );
  }

  if (showIncomingPrompt) {
    return (
      <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(45,107,255,0.16),_transparent_28%),linear-gradient(180deg,#090f1f_0%,#0c1327_52%,#11182f_100%)] text-white">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-8">
          <div>
            <p className="text-lg font-semibold">{title}</p>
            <p className="mt-1 text-sm text-[#96a2c1]">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleLeave("decline")}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#c7d2fe] transition hover:bg-white/5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to messages
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-white/5 p-8 text-center shadow-[0_30px_100px_rgba(2,6,23,0.45)]">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#2d6bff]/20 text-4xl font-semibold uppercase text-[#9db8ff]">
              {(title[0] ?? "Y").toUpperCase()}
            </div>
            <p className="mt-6 text-3xl font-semibold">{title}</p>
            <p className="mt-3 text-sm text-[#96a2c1]">
              Accept to join this {mode} call.
            </p>
            {joinError ? (
              <p className="mt-4 text-sm text-[#fca5a5]">{joinError}</p>
            ) : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void handleLeave("decline")}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ef4444] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#dc2626]"
              >
                <PhoneOff className="h-4 w-4" />
                Decline
              </button>
              <button
                type="button"
                disabled={actionPending}
                onClick={() => void joinCall(initialMode)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#2d6bff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5cf2] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {initialMode === "video" ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <Phone className="h-4 w-4" />
                )}
                Accept call
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(45,107,255,0.14),_transparent_26%),linear-gradient(180deg,#090f1f_0%,#0c1327_52%,#11182f_100%)] text-white">
      <ParticipantsAudio participants={remoteParticipants} />
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-8">
        <div>
          <p className="text-xl font-semibold">{title}</p>
          <p className="mt-1 text-sm text-[#96a2c1]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {permissionError ? (
            <span className="rounded-full border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-1 text-xs font-medium text-[#fca5a5]">
              {permissionError}
            </span>
          ) : null}
          {callingState === CallingState.RECONNECTING ||
          callingState === CallingState.MIGRATING ||
          callingState === CallingState.OFFLINE ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#60a5fa]/30 bg-[#60a5fa]/10 px-3 py-1 text-xs font-medium text-[#bfdbfe]">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Reconnecting
            </span>
          ) : null}
          <button
            type="button"
            onClick={() =>
              void handleLeave(
                callingState === CallingState.RINGING
                  ? activeCall.isCreatedByMe
                    ? "cancel"
                    : "decline"
                  : "leave"
              )
            }
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#c7d2fe] transition hover:bg-white/5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to messages
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
        <section className="relative flex-1 overflow-hidden rounded-[30px] border border-white/10 bg-[#0b1020]/70 p-3 shadow-[0_25px_80px_rgba(2,6,23,0.35)] sm:p-4">
          {isVideoMode ? (
            <div className="relative h-full min-h-[420px] rounded-[26px] bg-[#0a1020] sm:min-h-[520px]">
              {renderTile({
                participant: primaryVideoParticipant,
                label:
                  primaryVideoParticipant?.isLocalParticipant
                    ? "You"
                    : peerDisplayName ?? title,
              })}

              <div className="absolute bottom-4 left-4 z-10 w-[120px] max-w-[38vw] sm:bottom-6 sm:left-6 sm:w-[180px] lg:w-[220px]">
                <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#12192d] p-2 shadow-[0_18px_40px_rgba(2,6,23,0.45)] backdrop-blur">
                  {renderTile({
                    participant: localParticipant,
                    compact: true,
                    label: userInfo?.name || userInfo?.username || "You",
                  })}
                </div>
              </div>

              <div className="pointer-events-none absolute right-4 top-4 z-10 max-w-[min(90vw,320px)] rounded-2xl border border-white/10 bg-[#12192d]/90 px-4 py-3 text-xs leading-5 text-[#96a2c1] shadow-[0_18px_40px_rgba(2,6,23,0.4)] backdrop-blur sm:right-6 sm:top-6 sm:text-sm">
                <p className="font-semibold text-white">1:1 Stream call</p>
                <p className="mt-1">
                  This call stays linked to conversation {conversationId} and can
                  switch between audio and video in the same session.
                </p>
                {joinError ? (
                  <p className="mt-2 text-[#fca5a5]">{joinError}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[420px] items-center justify-center rounded-[26px] bg-[radial-gradient(circle,_rgba(45,107,255,0.22),_transparent_30%),linear-gradient(180deg,#101936_0%,#0b1020_100%)] px-6 py-12 text-center sm:min-h-[520px]">
              <div className="max-w-lg">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#2d6bff]/20 text-4xl font-semibold uppercase text-[#9db8ff] sm:h-36 sm:w-36 sm:text-5xl">
                  {(title[0] ?? "Y").toUpperCase()}
                </div>
                <p className="mt-6 text-3xl font-semibold">{title}</p>
                <p className="mt-3 text-sm text-[#96a2c1] sm:text-base">
                  {callingState === CallingState.JOINED && hasRemoteParticipant
                    ? "Audio call in progress"
                    : activeCall.isCreatedByMe
                      ? `Waiting for ${title} to answer`
                      : "Waiting for the other person to join"}
                </p>
                {joinError ? (
                  <p className="mt-4 text-sm text-[#fca5a5]">{joinError}</p>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-[30px] border border-white/10 bg-[#12192d] px-3 py-4 shadow-[0_18px_60px_rgba(2,6,23,0.3)] sm:px-6">
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
            <button
              type="button"
              onClick={() => void microphoneState.microphone.toggle()}
              className="flex min-h-[88px] min-w-0 flex-col items-center justify-center gap-2 rounded-[22px] border border-white/12 bg-white/5 px-3 py-3 text-[11px] text-[#c8d2ea] transition hover:bg-white/10 sm:min-w-[92px] sm:text-xs"
            >
              {microphoneState.isMute ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
              {microphoneState.isMute ? "Unmute" : "Mute"}
            </button>
            <button
              type="button"
              onClick={() => void handleVideoToggle()}
              className="flex min-h-[88px] min-w-0 flex-col items-center justify-center gap-2 rounded-[22px] border border-white/12 bg-white/5 px-3 py-3 text-[11px] text-[#c8d2ea] transition hover:bg-white/10 sm:min-w-[92px] sm:text-xs"
            >
              {isVideoMode && cameraState.isMute ? (
                <VideoOff className="h-6 w-6" />
              ) : (
                <Video className="h-6 w-6" />
              )}
              {isVideoMode
                ? cameraState.isMute
                  ? "Start video"
                  : "Stop video"
                : "Switch to video"}
            </button>
            <button
              type="button"
              onClick={() => void handleSpeakerUnlock()}
              className="flex min-h-[88px] min-w-0 flex-col items-center justify-center gap-2 rounded-[22px] border border-white/12 bg-white/5 px-3 py-3 text-[11px] text-[#c8d2ea] transition hover:bg-white/10 sm:min-w-[92px] sm:text-xs"
            >
              <Volume2 className="h-6 w-6" />
              Speaker
            </button>
            <button
              type="button"
              onClick={() =>
                void handleLeave(activeCall.isCreatedByMe ? "cancel" : "leave")
              }
              className="flex min-h-[88px] min-w-0 flex-col items-center justify-center gap-2 rounded-[22px] border border-[#ef4444]/20 bg-[#ef4444]/10 px-3 py-3 text-[11px] text-[#fecaca] transition hover:bg-[#ef4444]/20 sm:min-w-[92px] sm:text-xs"
            >
              <PhoneOff className="h-6 w-6" />
              End
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

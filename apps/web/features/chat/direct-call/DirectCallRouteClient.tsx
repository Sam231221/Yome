"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CallingState,
  OwnCapability,
  ParticipantView,
  ParticipantsAudio,
  StreamCall,
  StreamTheme,
  hasAudio,
  hasVideo,
  useCall,
  useCallStateHooks,
  useStreamVideoClient,
  type Call,
  type StreamVideoParticipant,
} from "@stream-io/video-react-sdk";
import {
  ArrowLeft,
  Loader2,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  RefreshCw,
  Video,
  VideoOff,
  Volume2,
  WifiOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useStateProvider } from "@/context/StateContext";
import {
  buildDirectCallDescriptor,
  getCallMemberIds,
  parseDirectCallCustomData,
} from "./guards";
import { consumeDirectCallAutoJoinIntent } from "./storage";
import { useCallTone } from "./useCallAlerts";
import type { DirectCallMode } from "./types";

type DirectCallRouteClientProps = {
  conversationId: string;
  callId: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; call: Call; initialMode: DirectCallMode };

const OUTGOING_RING_TIMEOUT_MS = 60_000;
const REMOTE_LEFT_GRACE_MS = 3_000;
const ENDED_AUTO_RETURN_SECONDS = 5;

const ACTIVE_CALL_STATES = new Set<CallingState>([
  CallingState.JOINED,
  CallingState.JOINING,
  CallingState.RECONNECTING,
  CallingState.MIGRATING,
  CallingState.OFFLINE,
]);

const getTerminalCallMessage = (reason?: string) => {
  switch (reason) {
    case "decline":
      return "The call was declined.";
    case "cancel":
      return "The call was cancelled.";
    case "timeout":
      return "No answer.";
    case "busy":
      return "The other person is on another call.";
    default:
      return "Call ended.";
  }
};

const formatDuration = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
};

const getDeviceNotice = (failed: { mic: boolean; camera: boolean }) => {
  if (failed.mic && failed.camera) {
    return "Microphone and camera are unavailable, so you joined muted with video off. Check your browser permissions.";
  }
  if (failed.mic) {
    return "Microphone unavailable, so you joined muted. Allow microphone access in your browser, then tap Unmute.";
  }
  if (failed.camera) {
    return "Camera unavailable, so you're on audio only. Allow camera access, then tap Start video.";
  }
  return undefined;
};

const getPeerMemberImage = (call: Call, currentUserId?: number) => {
  for (const member of call.state.members) {
    if (member.user?.id && member.user.id !== String(currentUserId)) {
      return member.user.image || undefined;
    }
  }
  return undefined;
};

function useDirectCallLoadState({
  conversationId,
  callId,
}: DirectCallRouteClientProps): LoadState {
  const [{ userInfo }] = useStateProvider();
  const client = useStreamVideoClient();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!client || !userInfo?.id) {
      setState({ status: "loading" });
      return;
    }

    let mounted = true;
    const call = client.call("default", callId);

    const load = async () => {
      try {
        await call.get();
        if (!mounted) return;

        const custom = parseDirectCallCustomData(call.state.custom);
        if (!custom || custom.conversationId !== conversationId) {
          setState({
            status: "error",
            message: "This call link does not belong to the selected conversation.",
          });
          return;
        }

        const memberIds = getCallMemberIds(call);
        if (!memberIds.includes(String(userInfo.id))) {
          setState({
            status: "error",
            message: "You are not a member of this direct call.",
          });
          return;
        }

        if (call.state.endedAt) {
          setState({
            status: "error",
            message: "This call has already ended.",
          });
          return;
        }

        setState({
          status: "ready",
          call,
          initialMode: custom.initialMode,
        });
      } catch {
        if (!mounted) return;
        setState({
          status: "error",
          message: "We couldn't load this call. It may have ended or the link is invalid.",
        });
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [callId, client, conversationId, userInfo?.id]);

  return state;
}

function DirectCallLoadingState({ label }: { label: string }) {
  return (
    <main className="grid min-h-screen w-full place-items-center bg-[#080d1b] px-6 text-center text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-lg font-semibold">{label}</p>
      </div>
    </main>
  );
}

function DirectCallErrorState({ message }: { message: string }) {
  const router = useRouter();

  return (
    <main className="grid min-h-screen w-full place-items-center bg-[#080d1b] px-6 text-center text-white">
      <div className="max-w-md rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_100px_rgba(2,6,23,0.45)]">
        <p className="text-2xl font-semibold">Call unavailable</p>
        <p className="mt-3 text-sm leading-6 text-[#aab4d1]">{message}</p>
        <button
          type="button"
          onClick={() => router.replace("/chat")}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#2d6bff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5cf2]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to messages
        </button>
      </div>
    </main>
  );
}

function DirectCallEndedState({
  title,
  message,
  duration,
}: {
  title: string;
  message: string;
  duration?: string;
}) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(ENDED_AUTO_RETURN_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      router.replace("/chat");
      return;
    }
    const timeout = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [router, secondsLeft]);

  return (
    <main className="grid min-h-screen w-full place-items-center bg-[#080d1b] px-6 text-center text-white">
      <div
        role="status"
        className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_100px_rgba(2,6,23,0.45)]"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ef4444]/15 text-[#fca5a5]">
          <PhoneOff className="h-6 w-6" />
        </div>
        <p className="mt-5 text-2xl font-semibold">{message}</p>
        <p className="mt-2 text-sm text-[#aab4d1]">
          {title}
          {duration ? ` · ${duration}` : ""}
        </p>
        <button
          type="button"
          onClick={() => router.replace("/chat")}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#2d6bff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5cf2]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to messages
        </button>
        <p className="mt-3 text-xs text-[#7f8aa8]">
          Returning automatically in {secondsLeft}s
        </p>
      </div>
    </main>
  );
}

function PeerAvatar({
  name,
  image,
  size,
}: {
  name: string;
  image?: string;
  size: "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "h-28 w-28 text-4xl sm:h-36 sm:w-36 sm:text-5xl" : "h-28 w-28 text-4xl";
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className={`mx-auto rounded-full object-cover ${sizeClass}`}
      />
    );
  }
  return (
    <div
      className={`mx-auto flex items-center justify-center rounded-full bg-[#2d6bff]/20 font-semibold uppercase text-[#9db8ff] ${sizeClass}`}
    >
      {(name[0] ?? "Y").toUpperCase()}
    </div>
  );
}

function DirectCallRoom({ initialMode }: { initialMode: DirectCallMode }) {
  const router = useRouter();
  const [{ userContacts, userInfo }] = useStateProvider();
  const call = useCall();
  const activeCall = call ?? undefined;
  const joinAttemptedRef = useRef(false);
  const acceptedRef = useRef(false);
  const hadRemoteParticipantRef = useRef(false);
  const mountedRef = useRef(false);
  const [mode, setMode] = useState<DirectCallMode>(initialMode);
  const [deviceNotice, setDeviceNotice] = useState<string>();
  const [joinError, setJoinError] = useState<string>();
  const [terminalMessage, setTerminalMessage] = useState<string>();
  const [actionPending, setActionPending] = useState(false);
  const [connectedAt, setConnectedAt] = useState<number>();
  const [endedAtMs, setEndedAtMs] = useState<number>();
  const [now, setNow] = useState(() => Date.now());

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

  const peer = useMemo(() => {
    if (!descriptor) return null;
    return (
      userContacts.find((contact) => contact.id === descriptor.peerUserId) ??
      null
    );
  }, [descriptor, userContacts]);

  const remoteParticipant = remoteParticipants[0];
  const hasRemoteParticipant = remoteParticipants.length > 0;
  // Use what each side is *publishing*, not the subscribed `videoStream`: Stream only
  // subscribes to a remote video once a <ParticipantView> for it is mounted, and the audio
  // layout mounts none — so keying off `videoStream` meant the peer's camera never appeared.
  const hasRemoteVideo = remoteParticipant ? hasVideo(remoteParticipant) : false;
  const isRemoteMuted = remoteParticipant ? !hasAudio(remoteParticipant) : false;
  const isLocalVideoOn = !cameraState.isMute;
  const isVideoMode = isLocalVideoOn || hasRemoteVideo;

  useEffect(() => {
    if (!hasRemoteParticipant) return;
    acceptedRef.current = true;
    hadRemoteParticipantRef.current = true;
    setTerminalMessage(undefined);
    setConnectedAt((value) => value ?? Date.now());
  }, [hasRemoteParticipant]);

  /**
   * Devices are best-effort: a missing or blocked microphone/camera must never stop the user
   * from joining (or cancel the call for the other person). We fall back to muted / audio-only
   * and tell the user why. Explicitly disabling a failed device also stops the SDK from
   * retrying it with the call's default device settings on join.
   */
  const syncDevicesForMode = useCallback(
    async (nextMode: DirectCallMode) => {
      const failed = { mic: false, camera: false };

      try {
        await microphoneState.microphone.enable();
      } catch {
        failed.mic = true;
        await microphoneState.microphone.disable().catch(() => undefined);
      }

      let resolvedMode = nextMode;
      if (nextMode === "video") {
        try {
          await cameraState.camera.enable();
        } catch {
          failed.camera = true;
          resolvedMode = "audio";
          await cameraState.camera.disable().catch(() => undefined);
        }
      } else {
        await cameraState.camera.disable().catch(() => undefined);
      }

      setMode(resolvedMode);
      setDeviceNotice(getDeviceNotice(failed));
      return resolvedMode;
    },
    [cameraState.camera, microphoneState.microphone]
  );

  const joinCall = useCallback(
    async (nextMode: DirectCallMode) => {
      if (!activeCall || actionPending) return;

      joinAttemptedRef.current = true;
      setActionPending(true);
      setJoinError(undefined);

      try {
        await syncDevicesForMode(nextMode);
        await activeCall.join();
      } catch {
        await cameraState.camera.disable().catch(() => undefined);
        await microphoneState.microphone.disable().catch(() => undefined);

        if (activeCall.isCreatedByMe) {
          await activeCall
            .leave({ reject: true, reason: "cancel" })
            .catch(() => undefined);
          setTerminalMessage("We couldn't connect the call.");
        } else {
          // Leave the incoming call ringing so the user can retry instead of rejecting it.
          joinAttemptedRef.current = false;
          setJoinError("We couldn't join the call. Check your connection and try again.");
        }
      } finally {
        setActionPending(false);
      }
    },
    [
      activeCall,
      actionPending,
      cameraState.camera,
      microphoneState.microphone,
      syncDevicesForMode,
    ]
  );

  useEffect(() => {
    if (!activeCall || joinAttemptedRef.current) return;
    if (
      callingState === CallingState.JOINED ||
      callingState === CallingState.JOINING
    ) {
      joinAttemptedRef.current = true;
      return;
    }

    const shouldAutoJoin =
      activeCall.isCreatedByMe ||
      consumeDirectCallAutoJoinIntent(activeCall.id);
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
      setTerminalMessage((current) => current ?? "Call ended.");
    });

    const offAccepted = activeCall.on("call.accepted", () => {
      acceptedRef.current = true;
      setTerminalMessage(undefined);
    });

    const offMissed = activeCall.on("call.missed", () => {
      if (acceptedRef.current || hadRemoteParticipantRef.current) return;
      setTerminalMessage("No answer.");
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
    if (
      callingState !== CallingState.RINGING &&
      callingState !== CallingState.JOINED
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (acceptedRef.current || hadRemoteParticipantRef.current) return;
      setTerminalMessage("No answer.");
      void activeCall
        .leave({ reject: true, reason: "timeout" })
        .catch(() => undefined);
    }, OUTGOING_RING_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [activeCall, callingState, hasRemoteParticipant]);

  // In a 1:1 call, the other person dropping out ends the call for us too.
  useEffect(() => {
    if (
      hasRemoteParticipant ||
      !activeCall ||
      !hadRemoteParticipantRef.current ||
      callingState !== CallingState.JOINED
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setTerminalMessage(`${peer?.name ?? "The other person"} left the call.`);
      void activeCall.leave().catch(() => undefined);
    }, REMOTE_LEFT_GRACE_MS);

    return () => window.clearTimeout(timeout);
  }, [activeCall, callingState, hasRemoteParticipant, peer?.name]);

  // Tab close / reload.
  useEffect(() => {
    if (!activeCall) return;

    const leaveOnClose = () => {
      const state = activeCall.state.callingState;
      if (!ACTIVE_CALL_STATES.has(state) && state !== CallingState.RINGING) return;
      const answered = acceptedRef.current || hadRemoteParticipantRef.current;
      void activeCall.leave(
        answered
          ? undefined
          : {
              reject: true,
              reason: activeCall.isCreatedByMe ? "cancel" : "decline",
            }
      );
    };

    window.addEventListener("pagehide", leaveOnClose);
    return () => window.removeEventListener("pagehide", leaveOnClose);
  }, [activeCall]);

  // In-app navigation away (back button, a link) unmounts this page without a pagehide;
  // without this the call kept running in the background with the mic live. The leave is
  // deferred a tick so a dev-mode remount doesn't drop the call.
  useEffect(() => {
    if (!activeCall) return;
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      window.setTimeout(() => {
        if (mountedRef.current) return;
        const state = activeCall.state.callingState;
        const isActive = ACTIVE_CALL_STATES.has(state);
        const isRingingOutgoing =
          state === CallingState.RINGING && activeCall.isCreatedByMe;
        if (!isActive && !isRingingOutgoing) return;

        const answered = acceptedRef.current || hadRemoteParticipantRef.current;
        void activeCall
          .leave(
            answered
              ? undefined
              : {
                  reject: true,
                  reason: activeCall.isCreatedByMe ? "cancel" : "decline",
                }
          )
          .catch(() => undefined);
      }, 0);
    };
  }, [activeCall]);

  const showEndedState =
    Boolean(terminalMessage) ||
    callingState === CallingState.LEFT ||
    Boolean(activeCall?.state.endedAt);
  const showReconnectFailed =
    !showEndedState && callingState === CallingState.RECONNECTING_FAILED;

  useEffect(() => {
    if (showEndedState) setEndedAtMs((value) => value ?? Date.now());
  }, [showEndedState]);

  useEffect(() => {
    if (!connectedAt || showEndedState) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [connectedAt, showEndedState]);

  const isOutgoingWaiting =
    Boolean(activeCall?.isCreatedByMe) &&
    !hasRemoteParticipant &&
    !showEndedState &&
    (callingState === CallingState.RINGING ||
      callingState === CallingState.JOINING ||
      callingState === CallingState.JOINED);
  useCallTone(isOutgoingWaiting ? "ringback" : null);

  const handleLeave = async () => {
    if (!activeCall || actionPending) return;
    setActionPending(true);

    try {
      const answered = acceptedRef.current || hadRemoteParticipantRef.current;
      if (!answered) {
        await activeCall.leave({
          reject: true,
          reason: activeCall.isCreatedByMe ? "cancel" : "decline",
        });
      } else if (activeCall.permissionsContext.hasPermission(OwnCapability.END_CALL)) {
        // Hang up for both people, like a phone call, rather than leaving the peer alone.
        await activeCall.endCall();
      } else {
        await activeCall.leave();
      }
    } catch {
      // The call may already be over on the server; we're leaving the screen regardless.
    } finally {
      router.replace("/chat");
    }
  };

  const handleRejoin = async () => {
    if (!activeCall || actionPending) return;
    setActionPending(true);
    setJoinError(undefined);
    try {
      await activeCall.join();
    } catch {
      setJoinError("Still unable to reconnect. Check your internet connection.");
    } finally {
      setActionPending(false);
    }
  };

  const handleMicToggle = async () => {
    try {
      await microphoneState.microphone.toggle();
      setDeviceNotice(undefined);
    } catch {
      setDeviceNotice(
        "Microphone unavailable. Allow microphone access in your browser and try again."
      );
    }
  };

  const handleVideoToggle = async () => {
    if (!activeCall || actionPending) return;
    setActionPending(true);

    try {
      if (cameraState.isMute) {
        try {
          await cameraState.camera.enable();
          setMode("video");
          setDeviceNotice(undefined);
        } catch {
          await cameraState.camera.disable().catch(() => undefined);
          setDeviceNotice(
            "Camera unavailable. Allow camera access in your browser and try again."
          );
        }
        return;
      }

      await cameraState.camera.disable();
      setMode("audio");
    } catch {
      setDeviceNotice("We couldn't change your camera. Please try again.");
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
        }),
      );
    } catch {
      setDeviceNotice("Your browser blocked call audio. Tap Speaker again to allow it.");
    }
  };

  const renderTile = ({
    participant,
    compact = false,
    label,
  }: {
    participant?: StreamVideoParticipant;
    compact?: boolean;
    label?: string;
  }) => {
    const participantName =
      label ??
      participant?.name ??
      participant?.userId ??
      peer?.name ??
      "Participant";
    const isMuted = participant ? !hasAudio(participant) : false;
    const isCameraOn = participant
      ? participant.isLocalParticipant
        ? isLocalVideoOn
        : hasVideo(participant)
      : false;

    if (!participant || !isCameraOn) {
      const image = participant?.isLocalParticipant
        ? userInfo?.profilePicture || undefined
        : peerImage;
      return (
        <div
          className={`relative flex h-full items-center justify-center rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_40%),linear-gradient(180deg,#11182f_0%,#0a1020_100%)] p-4 text-center text-white/70 ${
            compact ? "min-h-[180px]" : "min-h-[320px]"
          }`}
        >
          <div className="flex flex-col items-center">
            {compact ? (
              <VideoOff className="h-7 w-7 text-[#96a2c1]" aria-hidden="true" />
            ) : (
              <PeerAvatar name={participantName} image={image} size="md" />
            )}
            <p
              className={`flex items-center gap-2 font-semibold text-white ${
                compact ? "mt-2 text-sm" : "mt-4 text-xl"
              }`}
            >
              {isMuted ? (
                <MicOff className="h-4 w-4 text-[#fca5a5]" aria-label="Muted" />
              ) : null}
              {participantName}
            </p>
            <p className="mt-1 text-xs text-[#96a2c1]">
              {participant ? "Camera off" : "Connecting…"}
            </p>
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
          trackType="videoTrack"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#030712]/85 via-[#030712]/25 to-transparent px-5 pb-5 pt-16">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-white">
              {isMuted ? (
                <MicOff className="h-4 w-4 text-[#fca5a5]" aria-label="Muted" />
              ) : null}
              {participantName}
            </span>
            {participant.isLocalParticipant ? (
              <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#c7d2fe]">
                You
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  if (!activeCall) {
    return <DirectCallLoadingState label="Preparing call..." />;
  }

  const title =
    peer?.name ??
    descriptor?.peerName ??
    activeCall.state.createdBy?.name ??
    "Direct call";
  const peerImage =
    peer?.profilePicture || getPeerMemberImage(activeCall, userInfo?.id);
  const durationLabel = connectedAt
    ? formatDuration((endedAtMs ?? now) - connectedAt)
    : undefined;

  if (showEndedState) {
    return (
      <DirectCallEndedState
        title={title}
        message={terminalMessage ?? "Call ended."}
        duration={durationLabel}
      />
    );
  }

  const isReconnecting =
    callingState === CallingState.RECONNECTING ||
    callingState === CallingState.MIGRATING ||
    callingState === CallingState.OFFLINE;

  const subtitle =
    callingState === CallingState.RINGING && !activeCall.isCreatedByMe
      ? `Incoming ${mode} call`
      : isOutgoingWaiting
        ? "Ringing…"
        : callingState === CallingState.JOINING
          ? "Joining call…"
          : isReconnecting
            ? "Reconnecting…"
            : hasRemoteParticipant && durationLabel
              ? durationLabel
              : "Connected";

  const showIncomingPrompt =
    callingState === CallingState.RINGING &&
    !activeCall.isCreatedByMe &&
    !joinAttemptedRef.current;

  if (showIncomingPrompt) {
    return (
      <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(45,107,255,0.16),_transparent_28%),linear-gradient(180deg,#090f1f_0%,#0c1327_52%,#11182f_100%)] text-white">
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-white/5 p-8 text-center shadow-[0_30px_100px_rgba(2,6,23,0.45)]">
            <PeerAvatar name={title} image={peerImage} size="md" />
            <p className="mt-6 text-3xl font-semibold">{title}</p>
            <p className="mt-3 text-sm text-[#96a2c1]">
              Incoming {initialMode} call
            </p>
            {joinError ? (
              <p role="alert" className="mt-4 text-sm text-[#fca5a5]">
                {joinError}
              </p>
            ) : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={actionPending}
                onClick={() => void handleLeave()}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ef4444] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#dc2626] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PhoneOff className="h-4 w-4" />
                Decline
              </button>
              <button
                type="button"
                autoFocus
                disabled={actionPending}
                onClick={() => void joinCall(initialMode)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#22c55e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#16a34a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {initialMode === "video" ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <Phone className="h-4 w-4" />
                )}
                {joinError ? "Try again" : "Accept"}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (showReconnectFailed) {
    return (
      <main className="grid min-h-screen w-full place-items-center bg-[#080d1b] px-6 text-center text-white">
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_100px_rgba(2,6,23,0.45)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f59e0b]/15 text-[#fcd34d]">
            <WifiOff className="h-6 w-6" />
          </div>
          <p className="mt-5 text-2xl font-semibold">Connection lost</p>
          <p className="mt-2 text-sm text-[#aab4d1]">
            Your call with {title} was interrupted.
          </p>
          {joinError ? (
            <p role="alert" className="mt-3 text-sm text-[#fca5a5]">
              {joinError}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={actionPending}
              onClick={() => void handleLeave()}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-60"
            >
              <PhoneOff className="h-4 w-4" />
              End call
            </button>
            <button
              type="button"
              disabled={actionPending}
              onClick={() => void handleRejoin()}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#2d6bff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5cf2] disabled:opacity-60"
            >
              {actionPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Rejoin
            </button>
          </div>
        </div>
      </main>
    );
  }

  const audioStatusLine =
    callingState === CallingState.JOINED && hasRemoteParticipant
      ? isRemoteMuted
        ? `${title} is muted`
        : "Audio call in progress"
      : activeCall.isCreatedByMe
        ? `Calling ${title}…`
        : "Connecting…";

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(45,107,255,0.14),_transparent_26%),linear-gradient(180deg,#090f1f_0%,#0c1327_52%,#11182f_100%)] text-white">
      <ParticipantsAudio participants={remoteParticipants} />
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-8">
        <div>
          <p className="text-xl font-semibold">{title}</p>
          <p className="mt-1 text-sm tabular-nums text-[#96a2c1]" aria-live="polite">
            {subtitle}
          </p>
        </div>
        {isReconnecting ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-[#60a5fa]/30 bg-[#60a5fa]/10 px-3 py-1 text-xs font-medium text-[#bfdbfe]">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Reconnecting
          </span>
        ) : null}
      </div>

      {deviceNotice ? (
        <div
          role="alert"
          className="mx-3 mt-3 flex items-start justify-between gap-3 rounded-2xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-4 py-3 text-sm text-[#fde68a] sm:mx-6"
        >
          <span>{deviceNotice}</span>
          <button
            type="button"
            onClick={() => setDeviceNotice(undefined)}
            className="shrink-0 text-xs font-semibold text-[#fde68a]/80 hover:text-[#fde68a]"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
        <section className="relative flex-1 overflow-hidden rounded-[30px] border border-white/10 bg-[#0b1020]/70 p-3 shadow-[0_25px_80px_rgba(2,6,23,0.35)] sm:p-4">
          {isVideoMode ? (
            <div className="relative h-full min-h-[420px] rounded-[26px] bg-[#0a1020] sm:min-h-[520px]">
              {renderTile({
                participant: remoteParticipant,
                label: peer?.name ?? title,
              })}

              <div className="absolute bottom-4 left-4 z-10 w-[120px] max-w-[38vw] sm:bottom-6 sm:left-6 sm:w-[180px] lg:w-[220px]">
                <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#12192d] p-2 shadow-[0_18px_40px_rgba(2,6,23,0.45)] backdrop-blur">
                  {renderTile({
                    participant: localParticipant,
                    compact: true,
                    label: "You",
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[420px] items-center justify-center rounded-[26px] bg-[radial-gradient(circle,_rgba(45,107,255,0.22),_transparent_30%),linear-gradient(180deg,#101936_0%,#0b1020_100%)] px-6 py-12 text-center sm:min-h-[520px]">
              <div className="max-w-lg">
                <div className="relative mx-auto w-fit">
                  {isOutgoingWaiting ? (
                    <span className="absolute inset-0 animate-ping rounded-full bg-[#2d6bff]/25" />
                  ) : null}
                  <div className="relative">
                    <PeerAvatar name={title} image={peerImage} size="lg" />
                  </div>
                  {hasRemoteParticipant && isRemoteMuted ? (
                    <span className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0b1020] bg-[#ef4444] text-white">
                      <MicOff className="h-4 w-4" />
                    </span>
                  ) : null}
                </div>
                <p className="mt-6 text-3xl font-semibold">{title}</p>
                <p className="mt-3 text-sm text-[#96a2c1] sm:text-base">
                  {audioStatusLine}
                </p>
                {joinError ? (
                  <p role="alert" className="mt-4 text-sm text-[#fca5a5]">
                    {joinError}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-[30px] border border-white/10 bg-[#12192d] px-3 py-4 shadow-[0_18px_60px_rgba(2,6,23,0.3)] sm:px-6">
          <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
            <button
              type="button"
              onClick={() => void handleMicToggle()}
              aria-pressed={microphoneState.isMute}
              className={`flex min-h-[88px] min-w-0 flex-col items-center justify-center gap-2 rounded-[22px] border px-3 py-3 text-[11px] transition sm:min-w-[92px] sm:text-xs ${
                microphoneState.isMute
                  ? "border-[#ef4444]/30 bg-[#ef4444]/15 text-[#fecaca] hover:bg-[#ef4444]/25"
                  : "border-white/12 bg-white/5 text-[#c8d2ea] hover:bg-white/10"
              }`}
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
              disabled={actionPending}
              onClick={() => void handleVideoToggle()}
              aria-pressed={!cameraState.isMute}
              className="flex min-h-[88px] min-w-0 flex-col items-center justify-center gap-2 rounded-[22px] border border-white/12 bg-white/5 px-3 py-3 text-[11px] text-[#c8d2ea] transition hover:bg-white/10 disabled:opacity-60 sm:min-w-[92px] sm:text-xs"
            >
              {cameraState.isMute ? (
                <VideoOff className="h-6 w-6" />
              ) : (
                <Video className="h-6 w-6" />
              )}
              {cameraState.isMute
                ? isVideoMode
                  ? "Start video"
                  : "Switch to video"
                : "Stop video"}
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
              disabled={actionPending}
              onClick={() => void handleLeave()}
              className="flex min-h-[88px] min-w-0 flex-col items-center justify-center gap-2 rounded-[22px] border border-[#ef4444]/40 bg-[#ef4444] px-3 py-3 text-[11px] font-semibold text-white transition hover:bg-[#dc2626] disabled:opacity-60 sm:min-w-[92px] sm:text-xs"
            >
              <PhoneOff className="h-6 w-6" />
              {isOutgoingWaiting ? "Cancel" : "End"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export function DirectCallRouteClient(props: DirectCallRouteClientProps) {
  const state = useDirectCallLoadState(props);

  if (state.status === "loading") {
    return <DirectCallLoadingState label="Loading call..." />;
  }

  if (state.status === "error") {
    return <DirectCallErrorState message={state.message} />;
  }

  return (
    <main className="min-h-screen bg-[#080d1b]">
      <StreamCall call={state.call}>
        <StreamTheme>
          <DirectCallRoom initialMode={state.initialMode} />
        </StreamTheme>
      </StreamCall>
    </main>
  );
}

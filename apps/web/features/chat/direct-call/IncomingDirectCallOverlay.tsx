"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CallingState, useCalls } from "@stream-io/video-react-sdk";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useStateProvider } from "@/context/StateContext";
import {
  buildDirectCallDescriptor,
  isRelevantDirectCall,
} from "./guards";
import { buildDirectCallRoute } from "./routing";
import { markDirectCallAutoJoinIntent } from "./storage";
import { useCallTone, useTitleAlert } from "./useCallAlerts";

const IN_CALL_STATES = new Set<CallingState>([
  CallingState.JOINED,
  CallingState.JOINING,
  CallingState.RECONNECTING,
  CallingState.MIGRATING,
]);

export function IncomingDirectCallOverlay() {
  const [{ userContacts, userInfo }] = useStateProvider();
  const router = useRouter();
  const calls = useCalls();
  const [pendingCallId, setPendingCallId] = useState<string>();
  const autoRejectedIdsRef = useRef(new Set<string>());

  const activeIncomingCall = useMemo(() => {
    if (!userInfo?.id) return null;
    return (
      calls.find((call) => {
        if (!isRelevantDirectCall(call, userInfo.id)) return false;
        if (call.isCreatedByMe) return false;
        return call.state.callingState === CallingState.RINGING;
      }) ?? null
    );
  }, [calls, userInfo?.id]);

  const isInAnotherCall = useMemo(() => {
    if (!activeIncomingCall) return false;
    return calls.some(
      (call) =>
        call.id !== activeIncomingCall.id &&
        !call.state.endedAt &&
        IN_CALL_STATES.has(call.state.callingState)
    );
  }, [activeIncomingCall, calls]);

  // Already on a call: decline the new one as "busy" automatically instead of interrupting.
  useEffect(() => {
    if (!activeIncomingCall || !isInAnotherCall) return;
    if (autoRejectedIdsRef.current.has(activeIncomingCall.id)) return;
    autoRejectedIdsRef.current.add(activeIncomingCall.id);
    void activeIncomingCall
      .leave({ reject: true, reason: "busy" })
      .catch(() => undefined);
  }, [activeIncomingCall, isInAnotherCall]);

  const descriptor = useMemo(() => {
    if (!activeIncomingCall || !userInfo?.id) return null;
    return buildDirectCallDescriptor(activeIncomingCall, userInfo.id);
  }, [activeIncomingCall, userInfo?.id]);

  const caller = useMemo(() => {
    if (!descriptor) return null;
    return (
      userContacts.find((contact) => contact.id === descriptor.peerUserId) ?? null
    );
  }, [descriptor, userContacts]);

  const isVisible = Boolean(activeIncomingCall && descriptor && !isInAnotherCall);
  const createdBy = activeIncomingCall?.state.createdBy;
  const callerName =
    caller?.name || createdBy?.name || descriptor?.peerName || "Someone";
  const callerImage = caller?.profilePicture || createdBy?.image || undefined;
  const isVideo = descriptor?.initialMode === "video";

  useCallTone(isVisible ? "ringtone" : null);
  useTitleAlert(isVisible ? `Incoming call from ${callerName}` : null);

  if (!isVisible || !activeIncomingCall || !descriptor) return null;

  const isPending = pendingCallId === activeIncomingCall.id;

  const handleAccept = () => {
    markDirectCallAutoJoinIntent(activeIncomingCall.id);
    router.push(buildDirectCallRoute(descriptor.conversationId, descriptor.callId));
  };

  const handleDecline = async () => {
    setPendingCallId(activeIncomingCall.id);
    try {
      await activeIncomingCall.leave({ reject: true, reason: "decline" });
    } catch {
      toast.error("Couldn't decline the call. It may have already ended.");
    } finally {
      setPendingCallId(undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[#0b1020]/60 px-4 pb-6 pt-24 backdrop-blur-md sm:items-center sm:pb-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="incoming-call-title"
        aria-describedby="incoming-call-kind"
        className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#11182f] p-6 text-white shadow-[0_30px_100px_rgba(2,6,23,0.55)]"
      >
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#2d6bff]/30" />
            {callerImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={callerImage}
                alt=""
                className="relative h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#2d6bff]/20 text-2xl font-semibold uppercase text-[#8fb2ff]">
                {(callerName[0] ?? "Y").toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p id="incoming-call-title" className="truncate text-2xl font-semibold">
              {callerName}
            </p>
            <p
              id="incoming-call-kind"
              className="mt-1 flex items-center gap-2 text-sm text-[#9aa6c7]"
            >
              {isVideo ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
              Incoming {isVideo ? "video" : "audio"} call…
            </p>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => void handleDecline()}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ef4444] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#dc2626] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PhoneOff className="h-4 w-4" />
            Decline
          </button>
          <button
            type="button"
            autoFocus
            onClick={handleAccept}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#22c55e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#16a34a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isVideo ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

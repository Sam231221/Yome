"use client";

import { useMemo, useState } from "react";
import { CallingState, useCalls } from "@stream-io/video-react-sdk";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStateProvider } from "@/context/StateContext";
import {
  buildDirectCallDescriptor,
  isRelevantDirectCall,
} from "@/features/direct-call/lib/guards";
import { buildDirectCallRoute } from "@/features/direct-call/lib/routing";
import { markDirectCallAutoJoinIntent } from "@/features/direct-call/lib/storage";

export function IncomingDirectCallOverlay() {
  const [{ userContacts, userInfo }] = useStateProvider();
  const router = useRouter();
  const calls = useCalls();
  const [busyCallId, setBusyCallId] = useState<string>();

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

  const hasAnotherActiveCall = useMemo(() => {
    if (!activeIncomingCall) return false;
    return calls.some((call) => {
      if (call.id === activeIncomingCall.id) return false;
      if (call.state.endedAt) return false;
      return (
        call.state.callingState === CallingState.JOINED ||
        call.state.callingState === CallingState.JOINING ||
        call.state.callingState === CallingState.RINGING
      );
    });
  }, [activeIncomingCall, calls]);

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

  if (!activeIncomingCall || !descriptor) return null;

  const callerName = caller?.name ?? descriptor.peerName ?? "Incoming call";
  const modeLabel = descriptor.initialMode === "video" ? "Video call" : "Audio call";
  const isBusy = busyCallId === activeIncomingCall.id;

  const handleAccept = () => {
    if (hasAnotherActiveCall) {
      void handleReject("busy");
      return;
    }

    markDirectCallAutoJoinIntent(activeIncomingCall.id);
    router.push(buildDirectCallRoute(descriptor.conversationId, descriptor.callId));
  };

  const handleReject = async (reason: "decline" | "busy" = "decline") => {
    setBusyCallId(activeIncomingCall.id);
    try {
      await activeIncomingCall.leave({ reject: true, reason });
    } finally {
      setBusyCallId(undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[#0b1020]/60 px-4 pb-6 pt-24 backdrop-blur-md sm:items-center sm:pb-4">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#11182f] p-6 text-white shadow-[0_30px_100px_rgba(2,6,23,0.55)]">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2d6bff]/20 text-2xl font-semibold uppercase text-[#8fb2ff]">
            {(callerName[0] ?? "Y").toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-2xl font-semibold">{callerName}</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-[#9aa6c7]">
              {descriptor.initialMode === "video" ? (
                <Video className="h-4 w-4" />
              ) : (
                <Phone className="h-4 w-4" />
              )}
              {modeLabel}
            </p>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => void handleReject("decline")}
            disabled={isBusy}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ef4444] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#dc2626] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PhoneOff className="h-4 w-4" />
            Decline
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={isBusy}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#2d6bff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f5cf2] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {descriptor.initialMode === "video" ? (
              <Video className="h-4 w-4" />
            ) : (
              <Phone className="h-4 w-4" />
            )}
            {hasAnotherActiveCall ? "Busy" : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}

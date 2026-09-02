import { useTransition } from "react";
import { CallingState, useCalls } from "@stream-io/video-react-sdk";
import { MdCall } from "react-icons/md";
import { IoVideocam } from "react-icons/io5";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useStateProvider } from "@/context/StateContext";
import { createDirectCall } from "@/features/direct-call/lib/service";
import {
  getCallMemberIds,
  parseDirectCallCustomData,
} from "@/features/direct-call/lib/guards";
import { buildDirectCallRoute } from "@/features/direct-call/lib/routing";
import { markDirectCallAutoJoinIntent } from "@/features/direct-call/lib/storage";
import type { DirectCallMode } from "@/features/direct-call/types";
import { resolveChatKind } from "@/features/chat/types";
import { useStreamClientStatus } from "@/features/direct-call/providers/stream-client-status";

const REUSABLE_CALL_STATES = new Set<CallingState>([
  CallingState.RINGING,
  CallingState.JOINING,
  CallingState.JOINED,
  CallingState.RECONNECTING,
  CallingState.MIGRATING,
]);

export default function ChatHeaderCallActions() {
  const [{ currentChatUser, userInfo }] = useStateProvider();
  const router = useRouter();
  const { client, isConfigured, isLoading, setupError } = useStreamClientStatus();
  const calls = useCalls();
  const [isPending, startTransition] = useTransition();

  const startDirectChatCall = (initialMode: DirectCallMode) => {
    startTransition(() => {
      void (async () => {
        if (!client || !currentChatUser || typeof currentChatUser.id !== "number") {
          toast.error(
            setupError ??
              (isConfigured
                ? isLoading
                  ? "Call setup is still loading. Please try again."
                  : "Call setup is unavailable right now."
                : "Add valid Stream credentials in .env to enable audio and video calls.")
          );
          return;
        }
        if (!userInfo) {
          toast.error("We couldn't load your account for this call.");
          return;
        }

        try {
          const existingCall = calls.find((call) => {
            const custom = parseDirectCallCustomData(call.state.custom);
            if (!custom) return false;
            if (call.state.endedAt) return false;
            if (!REUSABLE_CALL_STATES.has(call.state.callingState)) return false;
            if (!currentChatUser.conversationId) return false;
            if (custom.conversationId !== currentChatUser.conversationId) {
              return false;
            }

            const memberIds = getCallMemberIds(call);
            return (
              memberIds.includes(String(userInfo.id)) &&
              memberIds.includes(String(currentChatUser.id))
            );
          });

          if (existingCall) {
            const custom = parseDirectCallCustomData(existingCall.state.custom);
            if (custom) {
              markDirectCallAutoJoinIntent(existingCall.id);
              const route = buildDirectCallRoute(
                custom.conversationId,
                existingCall.id
              );
              router.push(route);
              return;
            }
          }

          const descriptor = await createDirectCall({
            client,
            caller: userInfo,
            peer: currentChatUser,
            initialMode,
          });
          markDirectCallAutoJoinIntent(descriptor.callId);
          const route = buildDirectCallRoute(
            descriptor.conversationId,
            descriptor.callId
          );
          router.push(route);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "We couldn't start this call right now.";
          toast.error(message);
        }
      })();
    });
  };

  const disabled = resolveChatKind(currentChatUser) !== "user" || isPending;

  return (
    <>
      <button
        onClick={() => startDirectChatCall("audio")}
        disabled={disabled}
        className="chat-header-icon"
        aria-label="Voice call"
        type="button"
      >
        <MdCall />
      </button>
      <button
        onClick={() => startDirectChatCall("video")}
        disabled={disabled}
        className="chat-header-icon"
        aria-label="Video call"
        type="button"
      >
        <IoVideocam />
      </button>
    </>
  );
}

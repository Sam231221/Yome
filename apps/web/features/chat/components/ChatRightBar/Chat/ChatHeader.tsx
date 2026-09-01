import React, { useState, useTransition } from "react";
import { CallingState, useCalls } from "@stream-io/video-react-sdk";
import Avatar from "@/components/common/Avatar";
import AvatarWithStatus from "@/components/common/AvatarWithStatus";
import { BsThreeDotsVertical } from "react-icons/bs";
import { BiSearchAlt2 } from "react-icons/bi";
import { MdCall, MdArrowBack } from "react-icons/md";
import { IoVideocam } from "react-icons/io5";
import { FiUser } from "react-icons/fi";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import ContextMenu from "@/components/common/ContextMenu";
import { resolveChatKind } from "@/types/chat";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createDirectCall } from "@/features/chat/direct-call/service";
import {
  getCallMemberIds,
  parseDirectCallCustomData,
} from "@/features/chat/direct-call/guards";
import { markDirectCallAutoJoinIntent } from "@/features/chat/direct-call/storage";
import { buildDirectCallRoute } from "@/features/chat/direct-call/routing";
import type { DirectCallMode } from "@/features/chat/direct-call/types";
import { useStreamClientStatus } from "@/providers/stream-client-status";

const REUSABLE_CALL_STATES = new Set<CallingState>([
  CallingState.RINGING,
  CallingState.JOINING,
  CallingState.JOINED,
  CallingState.RECONNECTING,
  CallingState.MIGRATING,
]);

interface ChatHeaderProps {
  chatType: string;
  detailsOpen: boolean;
  onToggleDetails: () => void;
  onOpenDetails: () => void;
}

export default function ChatHeader({
  chatType,
  detailsOpen,
  onToggleDetails,
  onOpenDetails,
}: ChatHeaderProps) {
  const [{ currentChatUser, onlineUsers, messageSearch, userInfo }, dispatch] =
    useStateProvider();
  const router = useRouter();
  const { client, isConfigured, isLoading, setupError } = useStreamClientStatus();
  const calls = useCalls();
  const [isPending, startTransition] = useTransition();
  const [contextMenuCordinates, setContextMenuCordinates] = useState({
    x: 0,
    y: 0,
  });
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);

  const showContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuCordinates({ x: 22, y: 20 });
    setIsContextMenuVisible(true);
  };

  const contextMenuOptions = [
    {
      name: "Exit",
      callBack: async () => {
        setIsContextMenuVisible(false);
        dispatch({ type: reducerCases.SET_EXIT_CHAT });
      },
    },
  ];

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

  const handleBackToList = () => {
    dispatch({ type: reducerCases.SET_EXIT_CHAT });
  };

  return (
    <div className="chat-header">
      <div className="chat-header-main">
        <button
          onClick={handleBackToList}
          className="chat-header-icon mobile-only"
          aria-label="Back to chat list"
          type="button"
        >
          <MdArrowBack />
        </button>
        <div className="chat-header-avatar">
          {chatType === "group" ? (
            <Avatar
              size="lg"
              image={`${
                currentChatUser?.profilePicture || "/avatars/groupprofile.png"
              }`}
            />
          ) : (
            <AvatarWithStatus
              type="user"
              status={`${
                typeof currentChatUser?.id === "number" &&
                onlineUsers.includes(currentChatUser.id)
                  ? "online"
                  : "offline"
              }`}
              size="lg"
              image={`${
                currentChatUser?.profilePicture || "/avatars/userprofile.png"
              }`}
            />
          )}
        </div>
        <div className="chat-header-copy">
          <strong>{currentChatUser?.name}</strong>
          <small>
            {chatType === "group"
              ? currentChatUser?.about || "Collaborative study space"
              : typeof currentChatUser?.id === "number" &&
                  onlineUsers.includes(currentChatUser.id)
                ? "Online now"
                : "Available for messages"}
          </small>
        </div>
      </div>
      <div className="chat-header-actions relative">
        <button
          onClick={() => startDirectChatCall("audio")}
          disabled={
            resolveChatKind(currentChatUser) !== "user" || isPending
          }
          className="chat-header-icon"
          aria-label="Voice call"
          type="button"
        >
          <MdCall />
        </button>
        <button
          onClick={() => startDirectChatCall("video")}
          disabled={
            resolveChatKind(currentChatUser) !== "user" || isPending
          }
          className="chat-header-icon"
          aria-label="Video call"
          type="button"
        >
          <IoVideocam />
        </button>
        <button
          onClick={() => {
            onOpenDetails();
            if (!messageSearch) {
              dispatch({ type: reducerCases.SET_MESSAGES_SEARCH });
            }
          }}
          className="chat-header-icon desktop-only chat-header-secondary-action"
          aria-label="Search messages"
          type="button"
        >
          <BiSearchAlt2 />
        </button>
        <button
          onClick={onToggleDetails}
          className={`chat-header-icon desktop-only chat-header-secondary-action ${detailsOpen ? "is-active" : ""}`}
          aria-label={detailsOpen ? "Hide details panel" : "Show details panel"}
          type="button"
        >
          <FiUser />
        </button>
        <button
          onClick={(e) => showContextMenu(e)}
          className="chat-header-icon"
          aria-label="More options"
          id="context-opener"
          type="button"
        >
          <BsThreeDotsVertical />
        </button>
        {isContextMenuVisible && (
          <ContextMenu
            options={contextMenuOptions}
            cordinates={contextMenuCordinates}
            contextMenu={isContextMenuVisible}
            setContextMenu={setIsContextMenuVisible}
          />
        )}
      </div>
    </div>
  );
}

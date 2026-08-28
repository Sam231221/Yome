import React, { useState } from "react";
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
import { resolveChatKind, type ActiveCall } from "@/types/chat";

import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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
  const [{ currentChatUser, userInfo, onlineUsers, messageSearch }, dispatch] =
    useStateProvider();
  const router = useRouter();
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

  const handleVideoCall = async () => {
    if (!userInfo) return;
    try {
      const id = crypto.randomUUID();
      router.push(`/chat/${id}`);
      toast.success("Meeting Created");
    } catch {
      toast("Failed to create Meeting");
    }
  };

  const handleVoiceCall = () => {
    if (!currentChatUser?.id || typeof currentChatUser.id !== "number") return;
    const voiceCall: ActiveCall = {
      id: currentChatUser.id,
      name: currentChatUser.name,
      profilePicture: currentChatUser.profilePicture,
      type: "out-going",
      callType: "audio",
      roomId: Date.now(),
    };
    dispatch({
      type: reducerCases.SET_VOICE_CALL,
      voiceCall,
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
          onClick={handleVoiceCall}
          disabled={resolveChatKind(currentChatUser) !== "user"}
          className="chat-header-icon"
          aria-label="Voice call"
          type="button"
        >
          <MdCall />
        </button>
        <button
          onClick={handleVideoCall}
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
          className="chat-header-icon desktop-only"
          aria-label="Search messages"
          type="button"
        >
          <BiSearchAlt2 />
        </button>
        <button
          onClick={onToggleDetails}
          className={`chat-header-icon desktop-only ${detailsOpen ? "is-active" : ""}`}
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

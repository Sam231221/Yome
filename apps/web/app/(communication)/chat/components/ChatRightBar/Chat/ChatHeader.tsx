import React, { useState } from "react";
import Avatar from "@/components/common/Avatar";
import AvatarWithStatus from "@/components/common/AvatarWithStatus";
import { BsThreeDotsVertical } from "react-icons/bs";
import { BiSearchAlt2 } from "react-icons/bi";
import { MdCall, MdArrowBack } from "react-icons/md";
import { IoVideocam } from "react-icons/io5";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import ContextMenu from "@/components/common/ContextMenu";
import type { ActiveCall } from "@/types/chat";

import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface ChatHeaderProps {
  chatType: string;
}

export default function ChatHeader({ chatType }: ChatHeaderProps) {
  const [{ currentChatUser, userInfo, onlineUsers }, dispatch] =
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
    } catch (error) {
      console.error(error);
      toast("Failed to create Meeting");
    }
  };

  const handleVoiceCall = () => {
    if (!currentChatUser?.id) return;
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
    <div className="h-16 lg:px-6 md:px-4 px-4 py-3 flex justify-between items-center bg-white border-b border-[#E6E8EE] z-10">
      <div className="flex items-center lg:gap-4 md:gap-3 gap-2 flex-1 min-w-0">
        {/* Back button for small screens only (mobile) */}
        <button
          onClick={handleBackToList}
          className="md:hidden flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0"
          aria-label="Back to chat list"
        >
          <MdArrowBack className="text-[#7C3AED] text-xl" />
        </button>
        <div className="flex-shrink-0">
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
                onlineUsers.includes(currentChatUser?.id ?? "") ? "online" : "offline"
              }`}
              size="lg"
              image={`${
                currentChatUser?.profilePicture || "/avatars/userprofile.png"
              }`}
            />
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold text-[#111827] truncate lg:text-base md:text-base text-sm">
            {currentChatUser?.name}
          </span>
        </div>
      </div>
      <div className="flex lg:gap-4 md:gap-3 gap-2 relative flex-shrink-0">
        <button
          onClick={handleVoiceCall}
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Voice call"
        >
          <MdCall className="text-[#7C3AED] text-xl" />
        </button>
        <button
          onClick={handleVideoCall}
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Video call"
        >
          <IoVideocam className="text-[#7C3AED] text-xl" />
        </button>
        <button
          onClick={() => dispatch({ type: reducerCases.SET_MESSAGES_SEARCH })}
          className="h-9 w-9 hidden md:flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Search messages"
        >
          <BiSearchAlt2 className="text-[#7C3AED] text-xl" />
        </button>
        <button
          onClick={(e) => showContextMenu(e)}
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="More options"
          id="context-opener"
        >
          <BsThreeDotsVertical className="text-[#7C3AED] text-xl" />
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

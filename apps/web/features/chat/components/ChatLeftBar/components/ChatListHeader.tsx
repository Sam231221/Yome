import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { BsFillChatLeftTextFill, BsThreeDotsVertical } from "react-icons/bs";
import { useAuthState } from "@/features/auth/providers/AuthStateProvider";
import { chatReducerCases } from "@/features/chat/state/chat-reducer";
import { useChatState } from "@/features/chat/state/ChatStateContext";
import ContextMenu from "@/components/shared/ContextMenu";
import ProfileSkeleton from "@/features/chat/components/loading/ProfileSkeleton";
export default function ChatListHeader({
  isUserLoading,
}: {
  isUserLoading: boolean;
}) {
  const [{ userInfo }] = useAuthState();
  const [{ socket }, chatDispatch] = useChatState();
  const router = useRouter();
  const [contextMenuCordinates, setContextMenuCordinates] = useState({
    x: 0,
    y: 0,
  });
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);

  const showContextMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setContextMenuCordinates({ x: 56, y: 24 });
    setIsContextMenuVisible(true);
  };

  const contextMenuOptions = [
    {
      name: "Logout",
      icon: "BsBoxArrowRight",
      callBack: async () => {
        if (socket?.current && userInfo?.id) {
          socket.current.emit("signout", userInfo.id);
        }
        await signOut({ redirect: false });
        router.replace("/login");
      },
    },
  ];

  const handleAllContactsPage = () => {
    chatDispatch({ type: chatReducerCases.SET_ALL_CONTACTS_PAGE });
  };

  return (
    <div className="messages-inbox-header">
      {isUserLoading ? (
        <ProfileSkeleton />
      ) : (
        <div className="messages-title-group">
          <strong>Messages</strong>
          <small>
            {userInfo?.firstname
              ? `Hi, ${userInfo.firstname.charAt(0).toUpperCase()}${userInfo.firstname.slice(
                  1
                )}`
              : "Learning network"}
          </small>
        </div>
      )}

      <div className="messages-header-actions relative">
        <button
          className="messages-icon-button"
          title="New chat"
          onClick={handleAllContactsPage}
          type="button"
        >
          <BsFillChatLeftTextFill />
        </button>
        <button
          className="messages-icon-button"
          title="Menu"
          onClick={(e) => showContextMenu(e)}
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

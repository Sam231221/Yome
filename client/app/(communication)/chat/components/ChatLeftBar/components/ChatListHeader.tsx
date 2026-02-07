import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { BsFillChatLeftTextFill, BsThreeDotsVertical } from "react-icons/bs";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import ContextMenu from "@/components/common/ContextMenu";
import ProfileSkeleton from "@/components/Loading/Skeletons";
export default function ChatListHeader({
  isUserLoading,
}: {
  isUserLoading: boolean;
}) {
  const [{ userInfo, socket }, dispatch] = useStateProvider();
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
        signOut();
        socket.current.emit("signout", userInfo.id);
        router.push("/login");
      },
    },
  ];

  const handleAllContactsPage = () => {
    dispatch({ type: reducerCases.SET_ALL_CONTACTS_PAGE });
  };

  return (
    <div className="px-5 pt-5 pb-3 flex justify-between items-center">
      {isUserLoading ? (
        <ProfileSkeleton />
      ) : (
        <div className="flex flex-col">
          <span className="text-2xl font-semibold text-[#111827]">Chats</span>
          <span className="text-xs text-[#6B7280]">
            {userInfo?.firstname
              ? `Hi, ${userInfo.firstname.charAt(0).toUpperCase()}${userInfo.firstname.slice(
                  1
                )}`
              : "Messenger"}
          </span>
        </div>
      )}

      <div className="flex gap-2 relative">
        <button
          className="h-9 w-9 rounded-full bg-[#F1F3F9] border border-[#E6E8EE] flex items-center justify-center text-[#3F3F3F]"
          title="New chat"
          onClick={handleAllContactsPage}
        >
          <BsFillChatLeftTextFill className="text-lg" />
        </button>
        <button
          className="h-9 w-9 rounded-full bg-[#F1F3F9] border border-[#E6E8EE] flex items-center justify-center text-[#3F3F3F]"
          title="Menu"
          onClick={(e) => showContextMenu(e)}
          id="context-opener"
        >
          <BsThreeDotsVertical className="text-lg" />
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

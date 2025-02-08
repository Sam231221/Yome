import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { BsFillChatLeftTextFill, BsThreeDotsVertical } from "react-icons/bs";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import Avatar from "@/components/common/Avatar";
import ContextMenu from "@/components/common/ContextMenu";
import ProfileSkeleton from "@/components/Loading/Skeletons";
export default function ChatListHeader({ isUserLoading }) {
  const [{ userInfo, socket }, dispatch] = useStateProvider();
  const router = useRouter();
  const [contextMenuCordinates, setContextMenuCordinates] = useState({
    x: 0,
    y: 0,
  });
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);

  const showContextMenu = (e) => {
    e.preventDefault();
    setContextMenuCordinates({ x: 22, y: 25 });
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
    <div className="h-16 px-4 py-3 flex justify-between items-center">
      {isUserLoading ? (
        <>
          <ProfileSkeleton />
        </>
      ) : (
        <div className="flex gap-3 items-center">
          <div className="cursor-pointer">
            <Avatar
              type="sm"
              image={userInfo?.profilePicture || "/avatars/userprofile.png"}
            />
          </div>
          <span className="text-lg font-semibold text-gray-700">
            {userInfo?.firstname &&
              userInfo.firstname.charAt(0).toUpperCase() +
                userInfo.firstname.slice(1)}
          </span>
        </div>
      )}

      <div className="flex gap-6 relative ">
        <BsFillChatLeftTextFill
          className="text-panel-header-icon cursor-pointer text-xl"
          title="New chat"
          onClick={handleAllContactsPage}
        />
        <>
          <BsThreeDotsVertical
            className="text-panel-header-icon cursor-pointer text-xl"
            title="Menu"
            onClick={(e) => showContextMenu(e)}
            id="context-opener"
          />
          {isContextMenuVisible && (
            <ContextMenu
              options={contextMenuOptions}
              cordinates={contextMenuCordinates}
              contextMenu={isContextMenuVisible}
              setContextMenu={setIsContextMenuVisible}
            />
          )}
        </>
      </div>
    </div>
  );
}

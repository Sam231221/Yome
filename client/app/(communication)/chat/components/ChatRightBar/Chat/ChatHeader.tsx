import React, { useState } from "react";
import Avatar from "@/components/common/Avatar";
import AvatarWithStatus from "@/components/common/AvatarWithStatus";
import { BsThreeDotsVertical } from "react-icons/bs";
import { BiSearchAlt2 } from "react-icons/bi";
import { MdCall } from "react-icons/md";
import { IoVideocam } from "react-icons/io5";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import ContextMenu from "@/components/common/ContextMenu";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";

import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ChatHeader({ chatType }) {
  const [{ currentChatUser, userInfo, onlineUsers }, dispatch] =
    useStateProvider();
  const [callDetail, setCallDetail] = useState<Call>();
  const client = useStreamVideoClient();
  const router = useRouter();
  const [contextMenuCordinates, setContextMenuCordinates] = useState({
    x: 0,
    y: 0,
  });
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);

  const showContextMenu = (e) => {
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
    if (!client || !userInfo) return;
    try {
      const id = crypto.randomUUID();
      //create a call of type default and with the id
      const call = client.call("default", id);
      if (!call) throw new Error("Failed to create meeting");
      // //setting up start tme of now
      // const startsAt = new Date(Date.now()).toISOString();
      // const description = "Instant Meeting";
      await call.getOrCreate();
      //set the call state
      setCallDetail(call);
      //everything fine then push to the meeting page with call id
      router.push(`/chat/${call.id}`);

      toast.success("Meeting Created");
    } catch (error) {
      console.error(error);
      toast("Failed to create Meeting");
    }
    // dispatch({
    //   type: reducerCases.SET_VIDEO_CALL,
    //   videoCall: {
    //     ...currentChatUser,
    //     type: "out-going",
    //     callType: "video",
    //     roomId: Date.now(),
    //   },
    // });
  };

  const handleVoiceCall = () => {
    dispatch({
      type: reducerCases.SET_VOICE_CALL,
      voiceCall: {
        ...currentChatUser,
        type: "out-going",
        callType: "audio",
        roomId: Date.now(),
      },
    });
  };
  console.log("csad:", callDetail);
  return (
    <div className="h-16 px-4 py-3 flex justify-between items-center bg-white z-10">
      <div className="flex items-center justify-center gap-6">
        <div>
          {chatType === "group" ? (
            <Avatar
              type="lg"
              image={`${
                currentChatUser?.profilePicture || "/avatars/groupprofile.png"
              }`}
            />
          ) : (
            <AvatarWithStatus
              status={`${
                onlineUsers.includes(currentChatUser.id) ? "online" : "offline"
              }`}
              type="lg"
              image={`${
                currentChatUser?.profilePicture || "/avatars/userprofile.png"
              }`}
            />
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-700">
            {currentChatUser?.name}
          </span>
        </div>
      </div>
      <div className="flex gap-6 relative">
        <MdCall
          className="text-panel-header-icon cursor-pointer text-xl"
          onClick={handleVoiceCall}
        />
        <IoVideocam
          className="text-panel-header-icon cursor-pointer text-xl"
          onClick={handleVideoCall}
        />
        <BiSearchAlt2
          className="text-panel-header-icon cursor-pointer text-xl"
          onClick={() => dispatch({ type: reducerCases.SET_MESSAGES_SEARCH })}
        />
        <BsThreeDotsVertical
          className="text-panel-header-icon cursor-pointer text-xl"
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
      </div>
    </div>
  );
}

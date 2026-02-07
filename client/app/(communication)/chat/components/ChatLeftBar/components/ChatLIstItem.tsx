import React from "react";
import { FaCamera, FaMicrophone } from "react-icons/fa";
import Avatar from "@/components/common/Avatar";
import AvatarWithStatus from "@/components/common/AvatarWithStatus";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";

import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "@/components/common/MessageStatus";

interface ChatListItemProps {
  id: string;
  data: any;
  type: string;
  isContactPage?: boolean;
}

export default function ChatLIstItem({
  id,
  data,
  type,
  isContactPage = false,
}: ChatListItemProps) {
  const [{ userInfo, socket, onlineUsers, currentChatUser }, dispatch] =
    useStateProvider();

  const handleContactClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentChatUser?.id === data?.id) {
      return dispatch({ type: reducerCases.SET_ALL_CONTACTS_PAGE });
    }
    if (data?.identifier === "group") {
      socket.current.emit("join room", `room-${data.id}`, userInfo.id);
    }

    if (currentChatUser?.id === data?.id) {
      return dispatch({ type: reducerCases.SET_ALL_CONTACTS_PAGE });
    }

    if (!isContactPage) {
      if (e.currentTarget.getAttribute("data-name") === "group") {
        dispatch({
          type: reducerCases.CHANGE_CURRENT_CHAT_USER,
          user: {
            type: e.currentTarget.getAttribute("data-name"),
            name: data.name,
            about: data.about,
            profilePicture: data.thumbnail,
            identifier: data.identifier,
            email: data.email,
            id: data.id,
          },
        });
      }
      if (e.currentTarget.getAttribute("data-name") === "user") {
        dispatch({
          type: reducerCases.CHANGE_CURRENT_CHAT_USER,
          user: {
            type: e.currentTarget.getAttribute("data-name"),
            name: data.name,
            about: data.about,
            profilePicture: data.profilePicture,
            identifier: data.identifier,
            email: data.email,
            id: userInfo.id === data.senderId ? data.recieverId : data.senderId,
          },
        });
      }
    } else {
      dispatch({ type: reducerCases.CHANGE_CURRENT_CHAT_USER, user: data });
      dispatch({ type: reducerCases.SET_ALL_CONTACTS_PAGE });
    }
  };

  return (
    <div
      id={id}
      data-name={type}
      className={`mx-3 my-1 rounded-2xl flex cursor-pointer justify-center items-center transition ${
        currentChatUser?.id === data.id && !isContactPage
          ? "bg-[#F3F5FA]"
          : "hover:bg-[#F7F8FC]"
      }`}
      onClick={(e) => handleContactClick(e)}
    >
      <div className="min-w-fit pointer-events-none px-4 py-3">
        {type === "group" ? (
          <Avatar
            type="group"
            classNames="pointer-events-none"
            size="sm"
            image={`${data?.thumbnail || "/avatars/groupprofile.png"}`}
          />
        ) : (
          <AvatarWithStatus
            type="user"
            classNames="pointer-events-none"
            status={`${onlineUsers.includes(data?.id) ? "online" : "offline"}`}
            size="sm"
            image={`${data?.profilePicture || "/avatars/userprofile.png"}`}
          />
        )}
      </div>
      <div className="min-h-full flex pointer-events-none flex-col justify-center pr-4 w-full">
        <div className="flex pointer-events-none justify-between ">
          <div>
            <span className="pointer-events-none font-semibold text-sm text-[#111827]">
              {data?.name}
            </span>
          </div>

          {!isContactPage && (
            <div className="pointer-events-none">
              <span
                className={`${
                  !(data.totalUnreadMessages > 0)
                    ? "text-[#9CA3AF]"
                    : "text-[#1877F2]"
                } text-[11px] font-medium`}
              >
                {calculateTime(data.createdAt)}
              </span>
            </div>
          )}
        </div>
        <div className="flex pb-2 pt-1 pr-2">
          <div className="flex justify-between w-full">
            <span className="text-[#6B7280] line-clamp-1 text-xs">
              {isContactPage ? (
                <>
                  {type === "group" ? (
                    <> {data?.about || "\u00A0"}</>
                  ) : (
                    <>{data?.userProfile?.bio || "\u00A0"}</>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-1 max-w-[200px] sm:max-w-[250px] md:max-w-[300px] lg:max-w-[200px] xl:max-w-[300px]">
                  {data.senderId === userInfo.id && (
                    <MessageStatus messageStatus={data.messageStatus} />
                  )}
                  {data.type === "text" && (
                    <span className="truncate  text-xs">{data.message}</span>
                  )}
                  {data.type === "audio" && (
                    <span className="flex gap-1 text-xs items-center">
                      <FaMicrophone className="text-panel-header-icon" />
                      {data.senderId === userInfo.id ? (
                        <>You sent an Audio</>
                      ) : (
                        <>sent an Audio</>
                      )}
                    </span>
                  )}
                  {data.type === "image" && (
                    <span className="flex text-xs gap-1 items-center">
                      <FaCamera className="text-panel-header-icon" />
                      {data.senderId === userInfo.id ? (
                        <>You sent an Image</>
                      ) : (
                        <>sent an Image</>
                      )}
                    </span>
                  )}
                </div>
              )}
            </span>
            {type === "user" && data.totalUnreadMessages > 0 && (
              <span className="bg-[#1877F2] px-[6px] rounded-full text-[11px] text-white font-semibold">
                {data.totalUnreadMessages}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

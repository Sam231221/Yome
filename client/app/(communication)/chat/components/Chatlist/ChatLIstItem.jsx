import React from "react";
import Avatar from "@/components/common/Avatar";
import AvatarWithStatus from "@/components/common/AvatarWithStatus";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import { FaCamera, FaMicrophone } from "react-icons/fa";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "@/components/common/MessageStatus";
export default function ChatLIstItem({
  id,
  data,
  type,
  isContactPage = false,
}) {
  const [{ userInfo, socket, onlineUsers, currentChatUser }, dispatch] =
    useStateProvider();

  const handleContactClick = (e) => {
    if (currentChatUser?.id === data?.id) {
      return dispatch({ type: reducerCases.SET_ALL_CONTACTS_PAGE });
    }
    if (data?.identifier === "group") {
      socket.current.emit("join room", `room-${data.id}`, userInfo.id);
    }

    //here both CurrentchatUser and data are object
    if (currentChatUser?.id === data?.id) {
      return dispatch({ type: reducerCases.SET_ALL_CONTACTS_PAGE });
    }

    if (!isContactPage) {
      if (e.target.getAttribute("name") == "group") {
        dispatch({
          type: reducerCases.CHANGE_CURRENT_CHAT_USER,
          user: {
            type: e.target.getAttribute("name"),
            name: data.name,
            about: data.about,
            profilePicture: data.profilePicture,
            identifier: data.identifier,
            email: data.email,
            id: data.id,
          },
        });
      }
      if (e.target.getAttribute("name") == "user") {
        dispatch({
          type: reducerCases.CHANGE_CURRENT_CHAT_USER,
          user: {
            type: e.target.getAttribute("name"),
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
      //toggle with data object
      dispatch({ type: reducerCases.CHANGE_CURRENT_CHAT_USER, user: data });
      dispatch({ type: reducerCases.SET_ALL_CONTACTS_PAGE });
    }
  };
  return (
    <div
      id={id}
      name={type}
      className={`flex cursor-pointer justify-center items-center ${
        currentChatUser?.id === data.id && !isContactPage
          ? "bg-background-default-hover"
          : "hover:bg-background-default-hover"
      }`}
      onClick={(e) => handleContactClick(e)}
    >
      <div className="min-w-fit pointer-events-none px-5 pt-3 pb-1 ">
        {type === "group" ? (
          <Avatar
            chatType="group"
            className="pointer-events-none"
            type="sm"
            image={`${data?.profilePicture || "/avatars/groupprofile.png"}`}
          />
        ) : (
          <AvatarWithStatus
            chatType="user"
            className="pointer-events-none"
            status={`${onlineUsers.includes(data?.id) ? "online" : "offline"}`}
            type="sm"
            image={`${data?.profilePicture || "/avatars/userprofile.png"}`}
          />
        )}
      </div>
      <div className="min-h-full flex pointer-events-none flex-col justify-center mt-3 pr-2 w-full">
        <div className="flex pointer-events-none justify-between ">
          <div>
            <span className="pointer-events-none font-medium text-sm">
              {data?.name}
            </span>
          </div>

          {!isContactPage && (
            <div className="pointer-events-none">
              <span
                className={`${
                  !data.totalUnreadMessages > 0
                    ? "text-secondary"
                    : "text-icon-green"
                } text-xs font-medium`}
              >
                {calculateTime(data.createdAt)}
              </span>
            </div>
          )}
        </div>
        <div className="flex border-b border-conversation-border pb-2 pt-1 pr-2">
          <div className="flex justify-between w-full">
            <span className="text-secondary line-clamp-1 text-sm ">
              {isContactPage ? (
                <>
                  {type === "group" ? (
                    <> {data?.about || "\u00A0"}</>
                  ) : (
                    <>{data?.userProfile?.bio || "\u00A0"}</>
                  )}
                </>
              ) : (
                // Send msg by different ways for images,texts...
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
              <span className="bg-icon-green px-[5px] rounded-full text-sm">
                +{data.totalUnreadMessages}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { FaCamera, FaMicrophone } from "react-icons/fa";
import Avatar from "@/components/common/Avatar";
import AvatarWithStatus from "@/components/common/AvatarWithStatus";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";

import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "@/components/common/MessageStatus";
import {
  resolveChatKind,
  type ChatKind,
  type ChatListItem as ChatContact,
} from "@/types/chat";

interface ChatListItemProps {
  id: string;
  data: ChatContact;
  type: ChatKind;
  isContactPage?: boolean;
}

const getConversationType = (chat?: ChatContact) => resolveChatKind(chat);

const buildSelectedChat = ({
  data,
  type,
  isContactPage,
}: {
  data: ChatContact;
  type: ChatKind;
  isContactPage: boolean;
}): ChatContact | null => {
  if (!data?.id) return null;

  if (isContactPage) {
    const resolvedType: ChatKind = type === "group" ? "group" : "user";
    return {
      ...data,
      chatType: resolvedType,
      identifier: data.identifier || resolvedType,
      profilePicture:
        type === "group" ? data.thumbnail || data.profilePicture : data.profilePicture,
    };
  }

  const resolvedType: ChatKind = type === "group" ? "group" : "user";
  return {
    id: data.id,
    chatType: resolvedType,
    identifier: data.identifier || resolvedType,
    name: data.name,
    about: data.about,
    profilePicture: type === "group" ? data.thumbnail : data.profilePicture,
    email: data.email,
  };
};

export default function ChatListItem({
  id,
  data,
  type,
  isContactPage = false,
}: ChatListItemProps) {
  const [{ userInfo, socket, onlineUsers, currentChatUser }, dispatch] =
    useStateProvider();

  const handleContactClick = () => {
    const selectedChat = buildSelectedChat({ data, type, isContactPage });
    if (!selectedChat) return;

    const isSameConversation =
      currentChatUser?.id === selectedChat.id &&
      getConversationType(currentChatUser) === getConversationType(selectedChat);

    if (isSameConversation) {
      if (isContactPage) {
        dispatch({ type: reducerCases.SET_ALL_CONTACTS_PAGE });
      }
      return;
    }

    if (getConversationType(selectedChat) === "group") {
      socket?.current?.emit("join room", `room-${selectedChat.id}`, userInfo?.id);
    }

    dispatch({
      type: reducerCases.CHANGE_CURRENT_CHAT_USER,
      user: selectedChat,
    });

    if (isContactPage) {
      dispatch({ type: reducerCases.SET_ALL_CONTACTS_PAGE });
    }
  };

  const isActiveConversation =
    !isContactPage &&
    currentChatUser?.id === data?.id &&
    getConversationType(currentChatUser) === type;

  return (
    <div
      id={id}
      className={`lg:mx-3 md:mx-2 mx-2 my-1 rounded-2xl flex cursor-pointer justify-center items-center transition ${
        isActiveConversation
          ? "bg-[#F3F5FA]"
          : "hover:bg-[#F7F8FC]"
      }`}
      onClick={handleContactClick}
    >
      <div className="min-w-fit pointer-events-none lg:px-4 md:px-3 px-3 py-3">
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
            status={`${
              typeof data?.id === "number" && onlineUsers.includes(data.id)
                ? "online"
                : "offline"
            }`}
            size="sm"
            image={`${data?.profilePicture || "/avatars/userprofile.png"}`}
          />
        )}
      </div>
      <div className="min-h-full flex pointer-events-none flex-col justify-center lg:pr-4 md:pr-3 pr-3 w-full min-w-0">
        <div className="flex pointer-events-none justify-between items-center">
          <div className="flex-1 min-w-0">
            <span className="pointer-events-none font-semibold text-sm text-[#111827] truncate block">
              {data?.name}
            </span>
          </div>

          {!isContactPage && (
            <div className="pointer-events-none flex-shrink-0 ml-2">
              <span
                className={`${
                  !((data.totalUnreadMessages ?? 0) > 0)
                    ? "text-[#9CA3AF]"
                    : "text-[#1877F2]"
                } text-[11px] font-medium`}
              >
                {calculateTime(String(data.createdAt ?? ""))}
              </span>
            </div>
          )}
        </div>
        <div className="flex pb-2 pt-1 pr-2">
          <div className="flex justify-between w-full items-center gap-2">
            <span className="text-[#6B7280] line-clamp-1 text-xs flex-1 min-w-0">
              {isContactPage ? (
                <>
                  {type === "group" ? (
                    <> {data?.about || "\u00A0"}</>
                  ) : (
                    <>{data?.userProfile?.bio || "\u00A0"}</>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-1 min-w-0">
                  {userInfo && data.senderId === userInfo.id && (
                    <MessageStatus messageStatus={data.messageStatus} />
                  )}
                  {data.type === "text" && (
                    <span className="truncate text-xs">{data.message}</span>
                  )}
                  {data.type === "audio" && (
                    <span className="flex gap-1 text-xs items-center">
                      <FaMicrophone className="text-panel-header-icon flex-shrink-0" />
                      <span className="truncate">
                        {userInfo && data.senderId === userInfo.id ? (
                          <>You sent an Audio</>
                        ) : (
                          <>sent an Audio</>
                        )}
                      </span>
                    </span>
                  )}
                  {data.type === "image" && (
                    <span className="flex text-xs gap-1 items-center">
                      <FaCamera className="text-panel-header-icon flex-shrink-0" />
                      <span className="truncate">
                        {userInfo && data.senderId === userInfo.id ? (
                          <>You sent an Image</>
                        ) : (
                          <>sent an Image</>
                        )}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </span>
            {type === "user" && (data.totalUnreadMessages ?? 0) > 0 && (
              <span className="bg-[#1877F2] px-[6px] rounded-full text-[11px] text-white font-semibold flex-shrink-0">
                {data.totalUnreadMessages}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

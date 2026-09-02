import React from "react";
import { FaCamera, FaMicrophone } from "react-icons/fa";
import Avatar from "@/components/shared/media/Avatar";
import AvatarWithStatus from "@/features/chat/components/avatar-with-status";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";

import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "@/features/chat/components/message-status";
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
    <button
      id={id}
      type="button"
      className={`conversation-item ${
        isActiveConversation ? "active" : ""
      }`}
      onClick={handleContactClick}
    >
      <div className="conversation-avatar">
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
      <div className="conversation-copy">
        <div className="conversation-meta">
          <strong>{data?.name}</strong>
        </div>
        <div className="conversation-preview-row">
          <span className="conversation-preview">
            {isContactPage ? (
              <>
                {type === "group" ? data?.about || "\u00A0" : data?.userProfile?.bio || "\u00A0"}
              </>
            ) : (
              <span className="conversation-snippet">
                {userInfo && data.senderId === userInfo.id && (
                  <MessageStatus messageStatus={data.messageStatus} />
                )}
                {data.type === "text" && <span>{data.message}</span>}
                {data.type === "audio" && (
                  <>
                    <FaMicrophone />
                    <span>
                      {userInfo && data.senderId === userInfo.id
                        ? "You sent an audio clip"
                        : "Sent an audio clip"}
                    </span>
                  </>
                )}
                {data.type === "image" && (
                  <>
                    <FaCamera />
                    <span>
                      {userInfo && data.senderId === userInfo.id
                        ? "You sent an image"
                        : "Sent an image"}
                    </span>
                  </>
                )}
              </span>
            )}
          </span>
        </div>
      </div>
      {!isContactPage && (
        <div className="conversation-side">
          <span
            className={`conversation-time ${
              (data.totalUnreadMessages ?? 0) > 0 ? "unread" : ""
            }`}
          >
            {calculateTime(String(data.createdAt ?? ""))}
          </span>
          {type === "user" && (data.totalUnreadMessages ?? 0) > 0 && (
            <span className="conversation-badge">{data.totalUnreadMessages}</span>
          )}
        </div>
      )}
    </button>
  );
}

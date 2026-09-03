import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useAuthState } from "@/features/auth/providers/AuthStateProvider";
import { useChatState } from "@/features/chat/state/ChatStateContext";
import { calculateTime } from "@/features/chat/lib/calculateTime";
import MessageStatus from "@/features/chat/components/message-status";
import Avatar from "@/components/shared/media/Avatar";
import ImageMessage from "./ImageMessage";
import type { ChatMessage } from "@/features/chat/types";

const VoiceMessage = dynamic(() => import("./VoiceMessage"), {
  ssr: false,
});

export default function ChatContainer({ chatType }: { chatType: string }) {
  const [{ userInfo }] = useAuthState();
  const [{ messages, currentChatUser }] = useChatState();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentChatUser || !userInfo) return;

    const container = containerRef.current;
    if (container) {
      const lastMessage =
        container.lastElementChild?.lastElementChild?.lastElementChild
          ?.lastElementChild;

      if (lastMessage) {
        lastMessage.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [currentChatUser, messages, userInfo]);

  if (!currentChatUser || !userInfo) return null;

  const renderMessageMeta = (message: ChatMessage, isOwnMessage: boolean) => (
    <div className={`chat-message-meta ${isOwnMessage ? "mine" : ""}`}>
      <span>{calculateTime(String(message.createdAt))}</span>
      {isOwnMessage && <MessageStatus messageStatus={message.messageStatus} />}
    </div>
  );

  return (
    <div className="message-thread custom-scrollbar" ref={containerRef}>
      <div className="day-divider">
        <span>Today</span>
      </div>
      <div className="message-stack">
            {chatType === "user" &&
              messages.map((message: ChatMessage, index) => (
                <div
                  key={index}
                  className={`chat-message-row ${
                    message.senderId === currentChatUser.id ? "" : "mine"
                  }`}
                >
                  {message.type === "text" && (
                    <div className={`chat-message ${message.senderId === currentChatUser.id ? "" : "mine"}`}>
                      <p>{message.message}</p>
                      {renderMessageMeta(message, message.senderId === userInfo.id)}
                    </div>
                  )}
                  {message.type === "image" && (
                    <ImageMessage message={message} />
                  )}
                  {message.type === "audio" && (
                    <VoiceMessage message={message} />
                  )}
                </div>
              ))}

            {chatType === "group" &&
              messages
                ?.filter((message) => message.receiverId === null)
                .filter((message) => message.groupId === currentChatUser.id)
                .map((message: ChatMessage, index) => (
                  <div
                    key={index}
                    className={`chat-message-row ${
                      message.senderId === userInfo.id ? "mine" : ""
                    }`}
                  >
                    {message.type === "text" && (
                      <div className="group-chat-message">
                        {message.senderId !== userInfo.id && (
                          <div className="group-chat-avatar">
                            <Avatar
                              type="sm"
                              size="sm"
                              image={`${
                                message?.sender?.profilePicture ||
                                "/avatars/userprofile.png"
                              }`}
                            />
                          </div>
                        )}
                        <div
                          className={`chat-message ${
                            message.senderId === userInfo.id ? "mine" : ""
                          }`}
                        >
                          {message.senderId !== userInfo.id && (
                            <strong className="group-chat-name">
                              {message.sender?.name || "Member"}
                            </strong>
                          )}
                          <p>{message.message}</p>
                          {renderMessageMeta(message, message.senderId === userInfo.id)}
                        </div>
                      </div>
                    )}
                    {message.type === "image" && (
                      <ImageMessage message={message} />
                    )}
                    {message.type === "audio" && (
                      <VoiceMessage message={message} />
                    )}
                  </div>
                ))}
      </div>
    </div>
  );
}

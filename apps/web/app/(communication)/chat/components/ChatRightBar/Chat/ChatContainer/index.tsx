import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useStateProvider } from "@/context/StateContext";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "@/components/common/MessageStatus";
import Avatar from "@/components/common/Avatar";
import ImageMessage from "./ImageMessage";
import type { ChatMessage } from "@/types/chat";

const VoiceMessage = dynamic(() => import("./VoiceMessage"), {
  ssr: false,
});

export default function ChatContainer({ chatType }: { chatType: string }) {
  const [{ messages, currentChatUser, userInfo }] = useStateProvider();
  if (!currentChatUser || !userInfo) return null;

  const containerRef = useRef<HTMLDivElement>(null);

  //On Message Updates
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const lastMessage =
        container.lastElementChild?.lastElementChild?.lastElementChild
          ?.lastElementChild;

      if (lastMessage) {
        lastMessage.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  const renderMessageMeta = (message: ChatMessage, isOwnMessage: boolean) => (
    <div className="chat-message-meta">
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
                    <div
                      className={`chat-message ${
                        message.senderId === currentChatUser.id ? "" : "mine"
                      }`}
                    >
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

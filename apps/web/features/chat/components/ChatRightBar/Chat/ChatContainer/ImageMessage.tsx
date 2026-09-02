import { useStateProvider } from "@/context/StateContext";
import { calculateTime } from "@/utils/CalculateTime";
import Image from "next/image";
import React from "react";
import MessageStatus from "@/features/chat/components/message-status";
import type { ChatMessage } from "@/types/chat";

interface ImageMessageProps {
  message: ChatMessage;
}
function ImageMessage({ message }: ImageMessageProps) {
  const [{ currentChatUser, userInfo }] = useStateProvider();
  if (!currentChatUser || !userInfo) return null;
  const isOwnMessage = message.senderId === userInfo.id;
  return (
    <div className={`chat-message chat-message-media ${isOwnMessage ? "mine" : ""}`}>
      <div className="relative">
        <div className="chat-media-frame">
          <Image
            src={message.message}
            className="rounded-[18px] w-full h-full object-cover"
            alt="asset"
            height={800}
            width={800}
          />
        </div>
        <div className="chat-media-meta">
          <span>
            {calculateTime(String(message.createdAt))}
          </span>
          <span>
            {isOwnMessage && (
              <MessageStatus messageStatus={message.messageStatus} />
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ImageMessage;

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

  return (
    <div className="flex-1 w-full relative overflow-auto bg-[#F7F8FC] custom-scrollbar" ref={containerRef}>
      <div className="pointer-events-none absolute inset-0 bg-chat-background opacity-[0.04]"></div>
      <div className="lg:mx-8 md:mx-5 mx-4 lg:my-6 md:my-5 my-4 relative bottom-0 left-0 z-[1]">
        <div className="flex w-full">
          <div className="flex flex-col z-[2] justify-end w-full lg:gap-1 md:gap-1 gap-1 overflow-auto">
            {chatType === "user" &&
              messages.map((message: ChatMessage, index) => (
                // decide whether to display the message left or right at the right sidebar of chat.
                <div
                  key={index}
                  className={`flex ${
                    message.senderId === currentChatUser.id
                      ? "justify-start"
                      : "justify-end"
                  }`}
                >
                  {/* text message display */}
                  {message.type === "text" && (
                    <div
                      className={`text-white lg:px-3 md:px-3 px-2 lg:py-2 md:py-2 py-[5px] text-sm rounded-lg flex gap-2 max-w-[85%] md:max-w-[70%] lg:max-w-[45%]	
                     ${
                       message.senderId === currentChatUser.id
                         ? "bg-incoming-background"
                         : "bg-outgoing-background"
                     }`}
                    >
                      <span
                        className={` ${
                          message.senderId === currentChatUser.id
                            ? "text-black"
                            : "bg-outgoing-background"
                        } break-words lg:text-sm md:text-sm text-[13px] font-medium flex-1`}
                      >
                        {message.message}
                      </span>
                      <div className="flex items-end gap-1 flex-shrink-0">
                        <span
                          className={` ${
                            message.senderId === currentChatUser.id
                              ? "text-gray-800"
                              : "text-white"
                          } text-[9px] min-w-fit`}
                        >
                          {calculateTime(String(message.createdAt))}
                        </span>
                        <span>
                          {message.senderId === userInfo.id && (
                            <MessageStatus
                              messageStatus={message.messageStatus}
                            />
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* image message display */}
                  {message.type === "image" && (
                    <ImageMessage message={message} />
                  )}
                  {/* audio message display */}
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
                    className={`flex ${
                      message.senderId !== userInfo.id
                        ? "justify-start"
                        : "justify-end"
                    }`}
                  >
                    {/* text message display */}
                    {message.type === "text" && (
                      <div className="flex gap-2">
                        <Avatar
                          type="sm"
                          image={`${
                            message?.sender?.profilePicture ||
                            "/avatars/userprofile.png"
                          }`}
                        />
                        <div
                          className={`text-white lg:px-3 md:px-3 px-2 lg:py-2 md:py-2 py-[5px] text-sm rounded-lg flex gap-2 max-w-[85%] md:max-w-[70%] lg:max-w-[70%]	
                     ${
                       message.senderId !== userInfo.id
                         ? "bg-incoming-background"
                         : "bg-outgoing-background"
                     }`}
                        >
                          <span
                            className={` ${
                              message.senderId !== userInfo.id
                                ? "text-black"
                                : "bg-outgoing-background"
                            } break-words lg:text-sm md:text-sm text-[13px] font-medium flex-1`}
                          >
                            {message.message}
                          </span>
                          <div className="flex items-end gap-1 flex-shrink-0">
                            <span
                              className={` ${
                                message.senderId !== userInfo.id
                                  ? "text-gray-800"
                                  : "text-white"
                              } text-[9px] min-w-fit`}
                            >
                              {calculateTime(String(message.createdAt))}
                            </span>
                            <span>
                              {message.senderId !== userInfo.id && (
                                <MessageStatus
                                  messageStatus={message.messageStatus}
                                />
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* image message display */}
                    {message.type === "image" && (
                      <ImageMessage message={message} />
                    )}
                    {/* audio message display */}
                    {message.type === "audio" && (
                      <VoiceMessage message={message} />
                    )}
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}

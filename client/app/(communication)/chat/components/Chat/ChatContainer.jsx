import { useStateProvider } from "@/context/StateContext";
import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { calculateTime } from "@/utils/CalculateTime";
import { BsCheckAll, BsCheckLg } from "react-icons/bs";
import MessageStatus from "@/components/common/MessageStatus";
import ImageMessage from "./ImageMessage";

const VoiceMessage = dynamic(() => import("./VoiceMessage"), {
  ssr: false,
});

export default function ChatContainer() {
  const [{ messages, currentChatUser, userInfo }] = useStateProvider();

  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const lastMessage =
      container.lastElementChild.lastElementChild.lastElementChild
        .lastElementChild;

    if (lastMessage) {
      lastMessage.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div
      className="h-[80vh] w-full relative flex-grow overflow-auto custom-scrollbar "
      ref={containerRef}
    >
      <div className="bg-chat-background bg-fixed h-full w-full opacity-5 fixed left-0 top-0 z-0"></div>
      <div className="mx-10 my-6 relative bottom-0 z-40 left-0 ">
        <div className="flex w-full">
          <div className="flex flex-col justify-end w-full gap-1 overflow-auto">
            {messages.map((message, index) => (
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
                    className={`text-white px-2 py-[5px] text-sm rounded-lg flex gap-2  max-w-[45%]	
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
                      } break-all text-sm font-medium`}
                    >
                      {message.message}
                    </span>
                    <div className="flex items-center pt-2 gap-1">
                      <span
                        className={` ${
                          message.senderId === currentChatUser.id
                            ? "text-gray-800"
                            : "text-white"
                        } text-[9px]  min-w-fit`}
                      >
                        {calculateTime(message.createdAt)}
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
                {message.type === "image" && <ImageMessage message={message} />}
                {/* audio message display */}
                {message.type === "audio" && <VoiceMessage message={message} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

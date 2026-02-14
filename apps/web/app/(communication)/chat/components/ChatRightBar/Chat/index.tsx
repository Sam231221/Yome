import React from "react";
import ChatContainer from "./ChatContainer";
import ChatHeader from "./ChatHeader";
import MessageSendBar from "./MessageSendBar";

export default function Chat({
  id,
  chatType,
}: {
  id: string;
  chatType: string;
}) {
  return (
    <div className="lg:border-l md:border-l border-l-0 border-[#E6E8EE] w-full bg-white flex flex-col h-full min-h-0 z-10">
      <ChatHeader chatType={chatType} />
      <ChatContainer chatType={chatType} />
      <MessageSendBar id={id} chatType={chatType} />
    </div>
  );
}

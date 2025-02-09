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
    <div className="border-conversation-border border-l w-full bg-conversation-panel-background flex flex-col h-[100vh] z-10 ">
      <ChatHeader chatType={chatType} />
      <ChatContainer chatType={chatType} />
      <MessageSendBar id={id} chatType={chatType} />
    </div>
  );
}

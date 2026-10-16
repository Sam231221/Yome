import React from "react";
import ChatContainer from "./ChatContainer";
import ChatHeader from "./ChatHeader";
import MessageSendBar from "./MessageSendBar";

export default function Chat({
  id,
  chatType,
  detailsOpen,
  onToggleDetails,
  onOpenDetails,
}: {
  id: string;
  chatType: string;
  detailsOpen: boolean;
  onToggleDetails: () => void;
  onOpenDetails: () => void;
}) {
  return (
    <div className="chat-panel lg:border-l md:border-l border-l-0 border-[#E6E8EE] w-full bg-white flex flex-col h-full min-h-0 z-10">
      <ChatHeader
        chatType={chatType}
        detailsOpen={detailsOpen}
        onToggleDetails={onToggleDetails}
        onOpenDetails={onOpenDetails}
      />
      <ChatContainer chatType={chatType} />
      <MessageSendBar id={id} chatType={chatType} />
    </div>
  );
}

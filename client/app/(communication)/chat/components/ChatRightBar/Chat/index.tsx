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
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/3e9d039c-923e-469d-a996-c24e5de167f3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Chat/index.tsx:render',message:'Chat component rendering',data:{id,chatType},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
  // #endregion
  return (
    <div className="lg:border-l md:border-l border-l-0 border-[#E6E8EE] w-full bg-white flex flex-col h-full min-h-0 z-10">
      <ChatHeader chatType={chatType} />
      <ChatContainer chatType={chatType} />
      <MessageSendBar id={id} chatType={chatType} />
    </div>
  );
}

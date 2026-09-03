"use client";
import React, { useEffect, useState } from "react";
import Empty from "@/features/chat/components/empty-chat-state";
import { useChatState } from "@/features/chat/state/ChatStateContext";
import Chat from "./Chat";
import SearchMessagesRightMostChatContainer from "./SearchMessagesRightMostChatContainer";
import { resolveChatKind } from "@/features/chat/types";
export default function ChatRightBar() {
  const [{ currentChatUser, messageSearch }] = useChatState();
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    setDetailsOpen(false);
  }, [currentChatUser?.id]);

  useEffect(() => {
    if (messageSearch) {
      setDetailsOpen(true);
    }
  }, [messageSearch]);
  return (
    <>
      {currentChatUser ? (
        <div className={`chat-panel chat-layout-grid h-full w-full ${detailsOpen ? "details-open" : ""}`}>
          <Chat
            id={String(currentChatUser.id)}
            chatType={resolveChatKind(currentChatUser)}
            detailsOpen={detailsOpen}
            onToggleDetails={() => setDetailsOpen((value) => !value)}
            onOpenDetails={() => setDetailsOpen(true)}
          />
          <div className={`chat-details-slot ${detailsOpen ? "is-open" : ""}`}>
            <SearchMessagesRightMostChatContainer onClose={() => setDetailsOpen(false)} />
          </div>
        </div>
      ) : (
        <div className="h-full w-full">
          <div className="hidden h-full w-full md:block">
            <Empty />
          </div>
        </div>
      )}
    </>
  );
}

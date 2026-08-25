"use client";
import React from "react";
import Empty from "@/components/Empty";
import { useStateProvider } from "@/context/StateContext";
import Chat from "./Chat";
import SearchMessagesRightMostChatContainer from "./SearchMessagesRightMostChatContainer";
export default function ChatRightBar() {
  const [
    {
      currentChatUser,

      messageSearch,
    },
  ] = useStateProvider();
  return (
    <>
      {currentChatUser ? (
        <div
          className={
            messageSearch
              ? "grid h-full w-full lg:grid-cols-[1fr_320px] grid-cols-1"
              : "h-full w-full"
          }
        >
          <Chat
            id={String(currentChatUser.id)}
            chatType={currentChatUser.type || currentChatUser.identifier || "user"}
          />
          {/* Hide search panel on medium and smaller screens when message search is active */}
          {messageSearch && (
            <div className="hidden lg:block">
              <SearchMessagesRightMostChatContainer />
            </div>
          )}
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

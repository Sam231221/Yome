"use client";
import React, { useEffect, useState } from "react";
import Empty from "@/components/Empty";
import { useStateProvider } from "@/context/StateContext";
import Chat from "./Chat";
import SearchMessagesRightMostChatContainer from "./SearchMessagesRightMostChatContainer";
export default function ChatRightBar() {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const [
    {
      currentChatUser,

      messageSearch,
    },
    dispatch,
  ] = useStateProvider();
  const handleResize = () => {
    setWindowWidth(window.innerWidth);
  };

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  const isMobileView = windowWidth < 720;
  return (
    <>
      {currentChatUser ? (
        <div
          className={
            messageSearch
              ? "grid h-full w-full grid-cols-[1fr_320px]"
              : "h-full w-full"
          }
        >
          <Chat id={currentChatUser.id} chatType={currentChatUser.identifier} />
          {messageSearch && <SearchMessagesRightMostChatContainer />}
        </div>
      ) : (
        <div className="h-full w-full">
          {isMobileView ? <div></div> : <Empty />}
        </div>
      )}
    </>
  );
}

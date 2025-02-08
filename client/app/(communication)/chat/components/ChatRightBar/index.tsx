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
        <div className={messageSearch ? "grid grid-cols-2" : "grid-cols-2"}>
          <Chat id={currentChatUser.id} chatType={currentChatUser.identifier} />
          {messageSearch && <SearchMessagesRightMostChatContainer />}
        </div>
      ) : (
        <div>{isMobileView ? <div></div> : <Empty />}</div>
      )}
    </>
  );
}

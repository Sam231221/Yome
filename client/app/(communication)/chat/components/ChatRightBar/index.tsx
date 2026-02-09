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
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/3e9d039c-923e-469d-a996-c24e5de167f3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatRightBar/index.tsx:render',message:'ChatRightBar rendering',data:{hasChatUser:!!currentChatUser,chatUserId:currentChatUser?.id,chatUserName:currentChatUser?.name,chatUserType:currentChatUser?.type,chatUserIdentifier:currentChatUser?.identifier,windowWidth},timestamp:Date.now(),hypothesisId:'H2,H4'})}).catch(()=>{});
  // #endregion
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
          <Chat id={currentChatUser.id} chatType={currentChatUser.type || currentChatUser.identifier} />
          {/* Hide search panel on medium and smaller screens when message search is active */}
          {messageSearch && (
            <div className="hidden lg:block">
              <SearchMessagesRightMostChatContainer />
            </div>
          )}
        </div>
      ) : (
        <div className="h-full w-full">
          {isMobileView ? <div></div> : <Empty />}
        </div>
      )}
    </>
  );
}

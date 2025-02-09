import React, { useEffect, useState } from "react";
import { useStateProvider } from "@/context/StateContext";
import ChatListHeader from "./components/ChatListHeader";
import List from "./components/List";
import SearchBar from "./components/SearchBar";
import AllContactsList from "./components/AllContactsList";

export default function ChatLeftBar({
  isUserLoading,
}: {
  isUserLoading: boolean;
}) {
  const [pageType, setPageType] = useState("default");
  const [{ contactsPage }] = useStateProvider();
  useEffect(() => {
    if (contactsPage) {
      setPageType("all-contacts");
    } else {
      setPageType("default");
    }
  }, [contactsPage]);

  return (
    <div className="bg-white flex flex-col h-screen z-20 ">
      {pageType === "default" && (
        <>
          <ChatListHeader isUserLoading={isUserLoading} />
          <SearchBar />
          <List />
        </>
      )}
      {pageType === "all-contacts" && <AllContactsList />}
    </div>
  );
}

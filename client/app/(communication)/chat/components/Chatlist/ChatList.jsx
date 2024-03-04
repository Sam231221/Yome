import React, { useEffect, useState } from "react";
import ChatListHeader from "./ChatListHeader";
import List from "./List";
import SearchBar from "./SearchBar";
import ContactsList from "./ContactsList";
import { useStateProvider } from "@/context/StateContext";

export default function ChatList({ isUserLoading }) {
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
      {pageType === "all-contacts" && <ContactsList />}
    </div>
  );
}

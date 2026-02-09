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
    <div className="bg-white flex flex-col h-full z-20 lg:border-r border-[#E6E8EE] w-full">
      {pageType === "default" && (
        <>
          <ChatListHeader isUserLoading={isUserLoading} />
          <SearchBar />
          <div className="lg:px-5 md:px-4 px-4 pb-2">
            <div className="rounded-2xl border border-[#E8ECF3] bg-[#F7F9FC] lg:px-4 md:px-3 px-3 lg:py-3 md:py-3 py-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111827]">
                    Chat history is missing
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Enter your PIN to see messages that aren't loaded on this
                    device.
                  </p>
                </div>
                <button className="h-6 w-6 rounded-full bg-white border border-[#E6E8EE] text-[#6B7280] text-xs flex-shrink-0">
                  ×
                </button>
              </div>
              <button className="mt-3 w-full rounded-xl bg-[#1877F2] py-2 text-xs font-semibold text-white shadow-sm">
                Enter PIN
              </button>
            </div>
          </div>
          <List />
        </>
      )}
      {pageType === "all-contacts" && <AllContactsList />}
    </div>
  );
}

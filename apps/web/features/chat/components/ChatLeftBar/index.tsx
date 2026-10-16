import React, { useEffect, useState } from "react";
import { useStateProvider } from "@/context/StateContext";
import ChatListHeader from "./components/ChatListHeader";
import List, { type MessagesTab } from "./components/List";
import SearchBar from "./components/SearchBar";

const TABS: { id: MessagesTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "groups", label: "Groups" },
];

export default function ChatLeftBar({
  isUserLoading,
}: {
  isUserLoading: boolean;
}) {
  const [isBootstrapLoading, setIsBootstrapLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MessagesTab>("all");
  const [{ userContacts, groupContacts, userInfo }] = useStateProvider();

  const hasContacts = userContacts.length + groupContacts.length > 0;

  useEffect(() => {
    if (!userInfo?.id) {
      setIsBootstrapLoading(true);
      return;
    }

    if (hasContacts) {
      setIsBootstrapLoading(false);
    }
  }, [hasContacts, userInfo?.id]);

  const shouldShowLoadingState = isUserLoading || isBootstrapLoading;

  return (
    <div className="inbox-panel bg-white flex flex-col h-full z-20 lg:border-r border-[#E6E8EE] w-full">
      <ChatListHeader isUserLoading={isUserLoading} />
      <SearchBar />
      <div className="messages-filter-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {shouldShowLoadingState ? (
        <div className="lg:px-5 md:px-4 px-4 pb-3">
          <div className="space-y-3 rounded-2xl border border-[#E8ECF3] bg-[#F7F9FC] px-3 py-3 shadow-sm md:px-4">
            <div className="h-4 w-32 animate-pulse rounded bg-[#E5EAF3]" />
            <div className="h-3 w-48 animate-pulse rounded bg-[#E5EAF3]" />
            <div className="space-y-2 pt-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`chat-contact-skeleton-${index}`}
                  className="flex items-center gap-3"
                >
                  <div className="h-10 w-10 animate-pulse rounded-full bg-[#E5EAF3]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 animate-pulse rounded bg-[#E5EAF3]" />
                    <div className="h-2.5 w-24 animate-pulse rounded bg-[#E5EAF3]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      <List onBootstrapStateChange={setIsBootstrapLoading} activeTab={activeTab} />
      <div className="messages-inbox-footer">
        <button type="button">Message preferences</button>
      </div>
    </div>
  );
}

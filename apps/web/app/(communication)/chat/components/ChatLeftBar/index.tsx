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
  const [isBootstrapLoading, setIsBootstrapLoading] = useState(true);
  const [showHistoryRecovery, setShowHistoryRecovery] = useState(true);
  const [{ contactsPage, userContacts, groupContacts, userInfo }] =
    useStateProvider();

  const hasContacts = userContacts.length + groupContacts.length > 0;

  useEffect(() => {
    if (contactsPage) {
      setPageType("all-contacts");
    } else {
      setPageType("default");
    }
  }, [contactsPage]);

  useEffect(() => {
    if (!userInfo?.id) {
      setIsBootstrapLoading(true);
      return;
    }

    if (hasContacts) {
      setIsBootstrapLoading(false);
      setShowHistoryRecovery(false);
    }
  }, [hasContacts, userInfo?.id]);

  const shouldShowLoadingState = isUserLoading || isBootstrapLoading;
  const shouldShowHistoryCard =
    !shouldShowLoadingState && !hasContacts && showHistoryRecovery;

  return (
    <div className="bg-white flex flex-col h-full z-20 lg:border-r border-[#E6E8EE] w-full">
      {pageType === "default" && (
        <>
          <ChatListHeader isUserLoading={isUserLoading} />
          <SearchBar />
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
          {shouldShowHistoryCard ? (
            <div className="lg:px-5 md:px-4 px-4 pb-2">
              <div className="rounded-2xl border border-[#E8ECF3] bg-[#F7F9FC] lg:px-4 md:px-3 px-3 lg:py-3 md:py-3 py-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111827]">
                      Chat history is missing
                    </p>
                    <p className="text-xs text-[#6B7280] mt-1">
                      Enter your PIN to see messages that aren&apos;t loaded on this
                      device.
                    </p>
                  </div>
                  <button
                    className="h-6 w-6 rounded-full bg-white border border-[#E6E8EE] text-[#6B7280] text-xs flex-shrink-0"
                    onClick={() => setShowHistoryRecovery(false)}
                    aria-label="Dismiss chat history recovery notice"
                  >
                    ×
                  </button>
                </div>
                <button className="mt-3 w-full rounded-xl bg-[#1877F2] py-2 text-xs font-semibold text-white shadow-sm">
                  Enter PIN
                </button>
              </div>
            </div>
          ) : null}
          <List onBootstrapStateChange={setIsBootstrapLoading} />
        </>
      )}
      {pageType === "all-contacts" && <AllContactsList />}
    </div>
  );
}

import React, { useEffect, useRef } from "react";
import { useStateProvider } from "@/context/StateContext";

import ChatListItem from "./ChatListItem";

import { reducerCases } from "@/context/constants";
import {
  resolveChatKind,
  type ChatListItem as ChatListItemData,
} from "@/types/chat";
import {
  getInitialGroupMeta,
  getInitialUserMeta,
  logChatBootstrapError,
} from "@/lib/chat/chatApi";

export type MessagesTab = "all" | "unread" | "groups";

const sortByCreatedAt = (list: ChatListItemData[]) =>
  [...list].sort((a, b) => {
    const dateA = new Date(a.createdAt ?? 0);
    const dateB = new Date(b.createdAt ?? 0);
    return dateB.getTime() - dateA.getTime();
  });

const filterByTab = (list: ChatListItemData[], tab: MessagesTab) => {
  if (tab === "groups") {
    return list.filter((contact) => resolveChatKind(contact) === "group");
  }
  if (tab === "unread") {
    return list.filter((contact) => (contact.totalUnreadMessages ?? 0) > 0);
  }
  return list;
};

const getEmptyMessage = (tab: MessagesTab, searchActive: boolean) => {
  if (searchActive) return "No matches for your search.";
  if (tab === "unread") return "No unread messages.";
  if (tab === "groups") return "You haven't joined any groups yet.";
  return "No conversations yet.";
};

export default function List({
  activeTab,
  onBootstrapStateChange,
}: {
  activeTab: MessagesTab;
  onBootstrapStateChange?: (loading: boolean) => void;
}) {
  const [
    { userInfo, userContacts, groupContacts, filteredContacts, contactSearch },
    dispatch,
  ] = useStateProvider();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!userInfo?.id || hasLoadedRef.current) return;

    hasLoadedRef.current = true;
    onBootstrapStateChange?.(true);
    let cancelled = false;

    const getContacts = async () => {
      try {
        if (!userInfo?.id || cancelled) return;
        const { usersWithLatestPrivateMessages, onlineUsers } =
          await getInitialUserMeta(userInfo.id);
        if (cancelled) return;

        dispatch({
          type: reducerCases.SET_USER_CONTACTS,
          userContacts: usersWithLatestPrivateMessages,
        });
        dispatch({ type: reducerCases.SET_ONLINE_USERS, onlineUsers });
      } catch (error) {
        if (!cancelled) {
          logChatBootstrapError("initial contacts", error);
        }
      }
    };

    const getGroups = async () => {
      try {
        if (!userInfo?.id || cancelled) return;
        const groupsWithLatestGroupMessages = await getInitialGroupMeta(
          userInfo.id
        );
        if (cancelled) return;

        dispatch({
          type: reducerCases.SET_GROUP_CONTACTS,
          groupContacts: groupsWithLatestGroupMessages,
        });
      } catch (error) {
        if (!cancelled) {
          logChatBootstrapError("initial groups", error);
        }
      }
    };

    const bootstrap = async () => {
      await Promise.allSettled([getContacts(), getGroups()]);
      if (!cancelled) {
        onBootstrapStateChange?.(false);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
      onBootstrapStateChange?.(false);
    };
  }, [userInfo, dispatch, onBootstrapStateChange]);

  const searchActive = contactSearch !== "";
  const visibleContacts = searchActive
    ? filterByTab(filteredContacts, activeTab)
    : sortByCreatedAt(filterByTab([...userContacts, ...groupContacts], activeTab));

  return (
    <div className="conversation-list custom-scrollbar">
      {visibleContacts.length > 0 ? (
        visibleContacts.map((contact: ChatListItemData) => (
          <ChatListItem
            id={String(contact.id)}
            type={resolveChatKind(contact)}
            data={contact}
            key={String(contact.id)}
          />
        ))
      ) : (
        <div className="conversation-list-empty">
          <p>{getEmptyMessage(activeTab, searchActive)}</p>
        </div>
      )}
    </div>
  );
}

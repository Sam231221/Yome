import React, { useEffect, useRef } from "react";
import { useStateProvider } from "@/context/StateContext";

import ChatListItem from "./ChatListItem";

import { reducerCases } from "@/context/constants";
import type { ChatListItem as ChatListItemData } from "@/types/chat";
import {
  getInitialGroupMeta,
  getInitialUserMeta,
  logChatBootstrapError,
} from "@/lib/chat/chatApi";

export default function List({
  onBootstrapStateChange,
}: {
  onBootstrapStateChange?: (loading: boolean) => void;
}) {
  const [
    { userInfo, userContacts, groupContacts, filteredContacts },
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

  return (
    <div className="bg-white flex-auto overflow-auto max-h-full custom-scrollbar lg:pb-4 md:pb-3 pb-2">
      {filteredContacts && filteredContacts.length > 0
        ? filteredContacts.map((contact: ChatListItemData) => {
            return (
              <ChatListItem
                id={String(contact.id)}
                type={contact.identifier || contact.type || "user"}
                data={contact}
                key={String(contact.id)}
              />
            );
          })
        : [...userContacts, ...groupContacts]
            .sort((a: ChatListItemData, b: ChatListItemData) => {
              const dateA = new Date(a.createdAt ?? 0);
              const dateB = new Date(b.createdAt ?? 0);
              return dateB.getTime() - dateA.getTime();
            })
            .map((contact: ChatListItemData) => {
              return (
                <ChatListItem
                  id={String(contact.id)}
                  type={contact.identifier || contact.type || "user"}
                  data={contact}
                  key={String(contact.id)}
                />
              );
            })}
    </div>
  );
}

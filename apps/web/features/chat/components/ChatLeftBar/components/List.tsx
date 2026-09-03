import React, { useEffect, useRef } from "react";

import ChatListItem from "./ChatListItem";

import { chatReducerCases } from "@/features/chat/state/chat-reducer";
import { useChatState } from "@/features/chat/state/ChatStateContext";
import { useAuthState } from "@/features/auth/providers/AuthStateProvider";
import {
  resolveChatKind,
  type ChatListItem as ChatListItemData,
} from "@/features/chat/types";
import {
  getInitialGroupMeta,
  getInitialUserMeta,
  logChatBootstrapError,
} from "@/features/chat/api/chatApi";

export default function List({
  onBootstrapStateChange,
}: {
  onBootstrapStateChange?: (loading: boolean) => void;
}) {
  const [chatState, dispatch] = useChatState();
  const [{ userInfo }] = useAuthState();
  const { userContacts, groupContacts, filteredContacts } = chatState;
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
          type: chatReducerCases.SET_USER_CONTACTS,
          userContacts: usersWithLatestPrivateMessages,
        });
        dispatch({ type: chatReducerCases.SET_ONLINE_USERS, onlineUsers });
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
          type: chatReducerCases.SET_GROUP_CONTACTS,
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
    <div className="conversation-list custom-scrollbar">
      {filteredContacts && filteredContacts.length > 0
        ? filteredContacts.map((contact: ChatListItemData) => {
            return (
              <ChatListItem
                id={String(contact.id)}
                type={resolveChatKind(contact)}
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
                  type={resolveChatKind(contact)}
                  data={contact}
                  key={String(contact.id)}
                />
              );
            })}
    </div>
  );
}

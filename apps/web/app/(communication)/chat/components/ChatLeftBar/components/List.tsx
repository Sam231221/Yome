import React, { useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useStateProvider } from "@/context/StateContext";

import ChatListItem from "./ChatListItem";

import {
  GET_INITIAL_USERS_MESSAGES,
  GET_INITIAL_GROUP_MESSAGES,
} from "@/utils/ApiRoutes";
import { reducerCases } from "@/context/constants";

export default function List() {
  const [
    { userInfo, userContacts, groupContacts, filteredContacts },
    dispatch,
  ] = useStateProvider();

  useEffect(() => {
    const getContacts = async () => {
      try {
        const {
          data: { usersWithLatestPivateMessages, onlineUsers },
        } = await axios.get(`${GET_INITIAL_USERS_MESSAGES}/${userInfo.id}`);

        dispatch({
          type: reducerCases.SET_USER_CONTACTS,
          userContacts: usersWithLatestPivateMessages,
        });
        dispatch({ type: reducerCases.SET_ONLINE_USERS, onlineUsers });
      } catch (err: any) {
        toast.error(err.message);
      }
    };

    const getGroups = async () => {
      try {
        const {
          data: { groupsWithLatestGroupMessages },
        } = await axios.get(`${GET_INITIAL_GROUP_MESSAGES}/${userInfo.id}`);

        groupsWithLatestGroupMessages.forEach((group: any) => {
          group.messages.forEach((message: any) => {
            const { groupId, ...messageId } = message;
            messageId.messageId = messageId.id;
            delete messageId.id;

            group.messages[group.messages.indexOf(message)] = messageId;
            Object.assign(group, messageId);
          });
          delete group.messages;
        });

        dispatch({
          type: reducerCases.SET_GROUP_CONTACTS,
          groupContacts: groupsWithLatestGroupMessages,
        });
      } catch (err: any) {
        toast.error(err.message);
      }
    };

    if (userInfo?.id) {
      getContacts();
      getGroups();
    }
  }, [userInfo, dispatch]);

  return (
    <div className="bg-white flex-auto overflow-auto max-h-full custom-scrollbar lg:pb-4 md:pb-3 pb-2">
      {filteredContacts && filteredContacts.length > 0
        ? filteredContacts.map((contact: any) => {
            return (
              <ChatListItem
                id={contact.id}
                type={contact.identifier}
                data={contact}
                key={contact.id}
              />
            );
          })
        : [...userContacts, ...groupContacts]
            .sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt);
              const dateB = new Date(b.createdAt);
              return dateB.getTime() - dateA.getTime();
            })
            .map((contact: any) => {
              return (
                <ChatListItem
                  id={contact.id}
                  type={contact.identifier}
                  data={contact}
                  key={contact.id}
                />
              );
            })}
    </div>
  );
}

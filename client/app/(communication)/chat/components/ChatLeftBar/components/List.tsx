import React, { useEffect } from "react";
import axios from "axios";
import { useStateProvider } from "@/context/StateContext";

import ChatLIstItem from "./ChatLIstItem";

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
    try {
      const getContacts = async () => {
        const {
          data: { usersWithLatestPivateMessages, onlineUsers },
        } = await axios.get(`${GET_INITIAL_USERS_MESSAGES}/${userInfo.id}`);

        dispatch({
          type: reducerCases.SET_USER_CONTACTS,
          userContacts: usersWithLatestPivateMessages,
        });
        dispatch({ type: reducerCases.SET_ONLINE_USERS, onlineUsers });
      };

      const getGroups = async () => {
        const {
          data: { groupsWithLatestGroupMessages },
        } = await axios.get(`${GET_INITIAL_GROUP_MESSAGES}/${userInfo.id}`);

        groupsWithLatestGroupMessages.forEach((group) => {
          group.messages.forEach((message) => {
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
        // dispatch({ type: reducerCases.SET_ONLINE_USERS, onlineUsers });
      };

      if (userInfo?.id) {
        getContacts();
        getGroups();
      }
    } catch (err) {
      toast.error(err);
    }
  }, [userInfo]);
  console.log("userContacts:", userContacts);
  return (
    <div className="bg-white flex-auto overflow-auto max-h-full custom-scrollbar">
      {filteredContacts && filteredContacts.length > 0
        ? filteredContacts.map((contact) => {
            return (
              <ChatLIstItem
                id={contact.id}
                type={contact.identifier}
                data={contact}
                key={contact.id}
              />
            );
          })
        : [...userContacts, ...groupContacts]
            .sort((a, b) => {
              const dateA = new Date(a.createdAt);
              const dateB = new Date(b.createdAt);
              return dateB - dateA;
            })
            .map((contact) => {
              return (
                <ChatLIstItem
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

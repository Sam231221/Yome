import React, { useEffect } from "react";
import ChatLIstItem from "./ChatLIstItem";
import { useStateProvider } from "@/context/StateContext";
import axios from "axios";
import {
  GET_INITIAL_CONTACTS_ROUTE,
  GET_INITIAL_GROUPS,
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
        } = await axios.get(`${GET_INITIAL_CONTACTS_ROUTE}/${userInfo.id}`);
        console.log(
          "leftbar usersWithLatestPrivateMessages:",
          usersWithLatestPivateMessages
        );
        dispatch({
          type: reducerCases.SET_USER_CONTACTS,
          userContacts: usersWithLatestPivateMessages,
        });
        dispatch({ type: reducerCases.SET_ONLINE_USERS, onlineUsers });
      };

      const getGroups = async () => {
        const {
          data: { groupsWithLatestGroupMessages },
        } = await axios.get(
          `http://localhost:3005/api/group-messages/get-initial-group-messages/${userInfo.id}`
        );

        groupsWithLatestGroupMessages.forEach((group) => {
          // Loop through the messages array in each group
          group.messages.forEach((message) => {
            // Copy all fields except groupId from message to messageId
            const { groupId, ...messageId } = message;
            messageId.messageId = messageId.id; // Assuming you wanted to keep this unchanged
            delete messageId.id;
            // Replace the message object with the modified messageId object
            group.messages[group.messages.indexOf(message)] = messageId;
            Object.assign(group, messageId);
          });
          delete group.messages;
        });

        console.log("GroupWithLatestMessages", groupsWithLatestGroupMessages);
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
      console.error(err);
    }
  }, [userInfo]);
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
        : [...userContacts, ...groupContacts].map((contact) => {
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

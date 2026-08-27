import type { ChatKind, ChatListItem as ChatContact } from "@/types/chat";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { BiArrowBack, BiSearchAlt2 } from "react-icons/bi";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import { getAllChatContacts, getChatErrorMessage } from "@/lib/chat/chatApi";

import ChatListItem from "./ChatListItem";

interface Contact {
  id: string | number;
  type: ChatKind;
  name?: string;
  firstname?: string;
  username?: string;
  identifier: ChatKind;
}

function AllContactsList() {
  const [{ userInfo }, dispatch] = useStateProvider();
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [searchContacts, setSearchContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (!userInfo?.id) return;
    void getContacts();
  }, [userInfo?.id]);

  const getContacts = async () => {
    try {
      if (!userInfo?.id) return;

      const { followedUsers, groups } = await getAllChatContacts(userInfo.id);
      const combinedContacts = [...followedUsers, ...groups];
      const filteredContacts = combinedContacts.filter((obj: Contact) => {
        if (obj.type === "group") {
          return obj.name !== userInfo?.name;
        }

        return obj.firstname !== userInfo?.firstname;
      });

      setAllContacts(filteredContacts);
      setSearchContacts(filteredContacts);
    } catch (error) {
      toast.error(getChatErrorMessage(error, "Failed to fetch contacts"));
    }
  };

  useEffect(() => {
    if (searchTerm.length) {
      const filteredData = allContacts.filter((obj: Contact) => {
        const label = obj.name ?? obj.username ?? obj.firstname ?? "";
        return label.toLowerCase().includes(searchTerm.toLowerCase());
      });

      setSearchContacts(filteredData);
    } else {
      setSearchContacts(allContacts);
    }
  }, [searchTerm, allContacts]);

  return (
    <div className="h-full flex flex-col">
      <div className="h-24 flex items-end px-3 py-4">
        <div className="flex  items-center gap-12 ">
          <BiArrowBack
            className=" cursor-pointer text-xl"
            onClick={() =>
              dispatch({ type: reducerCases.SET_ALL_CONTACTS_PAGE })
            }
          />
          <h1 className="text-2xl text-panel-header-icon font-bold">
            New Chat
          </h1>
        </div>
      </div>
      <div className="bg-search-input-container-background h-full flex-auto overflow-auto custom-scrollbar">
        <div className=" flex py-3 px-4 items-center gap-3 h-14">
          <div className="bg-panel-header-background flex items-center gap-5 px-3 py-1 rounded-lg flex-grow">
            <div>
              <BiSearchAlt2 className="text-panel-header-icon cursor-pointer text-l" />
            </div>
            <div className="">
              <input
                type="text"
                placeholder="Search Contacts"
                className="bg-transparent text-sm focus:outline-none  w-full"
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
              />
            </div>
          </div>
        </div>
        {searchContacts?.map((contact) => {
          return (
            <ChatListItem
              id={String(contact.id)}
              type={contact.identifier}
              data={contact as ChatContact}
              isContactPage
              key={String(contact.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default AllContactsList;

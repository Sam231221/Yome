import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { BiArrowBack, BiSearchAlt2 } from "react-icons/bi";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import {
  GET_ALL_CONNECTED_USERS,
  GET_ALL_CONNECTED_GROUPS,
} from "@/utils/ApiRoutes";

import ChatLIstItem from "./ChatLIstItem";

interface Contact {
  id: string;
  type: string;
  name?: string;
  firstname?: string;
  username?: string;
  identifier: string;
}

function AllContactsList() {
  const [{ userInfo }, dispatch] = useStateProvider();
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [searchContacts, setSearchContacts] = useState<Contact[]>([]);

  // Get all contacts
  useEffect(() => {
    getContacts();
  }, []);

  const getContacts = async () => {
    try {
      const {
        data: { followedUsers },
      } = await axios.get(`${GET_ALL_CONNECTED_USERS}/${userInfo.id}`);

      const {
        data: { groups },
      } = await axios.get(`${GET_ALL_CONNECTED_GROUPS}/${userInfo.id}`);

      let combinedContacts = [...followedUsers, ...groups];
      setAllContacts(
        combinedContacts.filter((obj: Contact) => {
          if (obj.type === "group") {
            return obj.name !== userInfo.name;
          } else {
            return obj.firstname !== userInfo.firstname;
          }
        })
      );
      setSearchContacts(
        combinedContacts.filter((obj: Contact) => {
          if (obj.type === "group") {
            return obj.name !== userInfo.name;
          } else {
            return obj.firstname !== userInfo.firstname;
          }
        })
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to fetch contacts");
    }
  };

  useEffect(() => {
    if (searchTerm.length) {
      let filteredData: Contact[] = [];
      filteredData = allContacts.filter((obj: Contact) => {
        if (obj.type === "group") {
          return obj.name?.toLowerCase().includes(searchTerm.toLowerCase());
        } else {
          return obj.name?.toLowerCase().includes(searchTerm.toLowerCase());
        }
      });

      setSearchContacts(filteredData);
    } else {
      setSearchContacts(allContacts);
    }
  }, [searchTerm, allContacts]);
  console.log("ssd:", searchContacts);
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
            <ChatLIstItem
              id={contact.id}
              type={contact.identifier}
              data={contact}
              isContactPage
              key={contact.id}
            />
          );
        })}
      </div>
    </div>
  );
}

export default AllContactsList;

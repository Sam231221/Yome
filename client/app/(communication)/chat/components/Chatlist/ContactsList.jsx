import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import { GET_ALL_USERS, GET_ALL_GROUPS } from "@/utils/ApiRoutes";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { BiArrowBack, BiSearchAlt2 } from "react-icons/bi";
import ChatLIstItem from "./ChatLIstItem";

function ContactsList() {
  const [{ userInfo }, dispatch] = useStateProvider();
  const [allContacts, setAllContacts] = useState([]);
  const [searchTerm, setsearchTerm] = useState("");

  const [searchContacts, setSearchContacts] = useState([]);

  //Get all contacts
  useEffect(() => {
    const getContacts = async () => {
      try {
        const {
          data: { users },
        } = await axios.get(GET_ALL_USERS);
        const {
          data: { groups },
        } = await axios.get(GET_ALL_GROUPS);
        let combinedContacts = [...users, ...groups];
        setAllContacts(
          combinedContacts.filter((obj) => obj.name !== userInfo.name)
        );
        setSearchContacts(
          combinedContacts.filter((obj) => obj.name !== userInfo.name)
        );
      } catch (err) {
        console.log(err);
      }
    };
    getContacts();
  }, []);
  useEffect(() => {
    if (searchTerm.length) {
      let filteredData = [];
      filteredData = allContacts.filter((obj) =>
        obj.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setSearchContacts(filteredData);
    } else {
      setSearchContacts(allContacts);
    }
  }, [searchTerm]);

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
                onChange={(e) => setsearchTerm(e.target.value)}
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

export default ContactsList;

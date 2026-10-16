import { useStateProvider } from "@/context/StateContext";
import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { BiFilter, BiSearchAlt2, BiArrowBack } from "react-icons/bi";
import { FiBellOff, FiSearch, FiUser } from "react-icons/fi";
import { reducerCases } from "@/context/constants";
import { calculateTime } from "@/utils/CalculateTime";
import type { ChatMessage } from "@/types/chat";

function SearchMessagesRightMostChatContainer({
  onClose,
}: {
  onClose: () => void;
}) {
  const [{ currentChatUser, messages, messageSearch }, dispatch] = useStateProvider();
  const [searchBarFocus, setSearchBarFocus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedMessages, setSearchedMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (searchTerm) {
      setSearchedMessages(
        messages.filter(
          (message) =>
            message.type === "text" &&
            message.message.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setSearchedMessages([]);
    }
  }, [messages, searchTerm]);

  const sharedFiles = messages
    .filter((message) => message.type === "image" || message.type === "audio")
    .slice(-4)
    .reverse();

  const profileInitials = (currentChatUser?.name ?? "Y")
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="chat-details chat-search-panel">
      {currentChatUser && !messageSearch && (
        <>
          <div className="chat-profile">
            <div className="chat-profile-avatar">{profileInitials}</div>
            <strong>{currentChatUser.name}</strong>
            <span>
              {currentChatUser.about || "AI student · Imperial College"}
            </span>
          </div>

          <div className="chat-detail-actions">
            <button type="button" onClick={() => dispatch({ type: reducerCases.SET_MESSAGES_SEARCH })}>
              <FiSearch />
              <span>Search</span>
            </button>
            <button type="button">
              <FiBellOff />
              <span>Mute</span>
            </button>
            <button type="button">
              <FiUser />
              <span>Profile</span>
            </button>
          </div>

          <div className="chat-section-header">
            <strong>Shared files</strong>
            <button
              type="button"
              onClick={() => dispatch({ type: reducerCases.SET_MESSAGES_SEARCH })}
            >
              View all
            </button>
          </div>

          <div className="chat-details-body custom-scrollbar">
            <div className="chat-search-results">
              {sharedFiles.length ? (
                sharedFiles.map((message) => (
                  <article className="shared-file" key={message.id}>
                    <div className="shared-file-badge">
                      {message.type === "image" ? "IMG" : "AUD"}
                    </div>
                    <div>
                      <strong>
                        {message.type === "image" ? "Image attachment" : "Audio clip"}
                      </strong>
                      <span>{calculateTime(String(message.createdAt))}</span>
                    </div>
                  </article>
                ))
              ) : (
                <p className="chat-search-hint">No shared files yet.</p>
              )}
            </div>
            <div className="chat-safety">Privacy &amp; safety</div>
          </div>
        </>
      )}

      {messageSearch && (
        <>
          <div className="chat-details-header">
            <button
              className="messages-icon-button"
              onClick={() => {
                setSearchTerm("");
                setSearchBarFocus(false);
                dispatch({ type: reducerCases.SET_MESSAGES_SEARCH });
                onClose();
              }}
              type="button"
              aria-label="Close message search"
            >
              <IoClose />
            </button>
            <strong>Search Messages</strong>
          </div>
          <div className="chat-details-body custom-scrollbar">
            <div className="chat-search-controls">
              <label className="messages-search compact">
                {searchBarFocus ? (
                  <BiArrowBack className="messages-search-icon" />
                ) : (
                  <BiSearchAlt2 className="messages-search-icon" />
                )}
                <input
                  type="text"
                  placeholder="Search messages"
                  onFocus={() => setSearchBarFocus(true)}
                  onBlur={() => setSearchBarFocus(false)}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  value={searchTerm}
                />
              </label>
              <button className="messages-icon-button" type="button" aria-label="Filters">
                <BiFilter />
              </button>
            </div>

            {!searchTerm.length && (
              <p className="chat-search-hint">
                Search for messages with {currentChatUser?.name ?? "this chat"}
              </p>
            )}

            {searchTerm.length > 0 && !searchedMessages.length && (
              <p className="chat-search-hint">No messages found</p>
            )}

            <div className="chat-search-results">
              {searchedMessages.map((message) => (
                <article className="shared-file" key={message.id}>
                  <div className="shared-file-badge">TXT</div>
                  <div>
                    <strong>{calculateTime(String(message.createdAt))}</strong>
                    <span>{message.message}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

export default SearchMessagesRightMostChatContainer;

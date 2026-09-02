import { useState } from "react";
import type React from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { BiSearchAlt2 } from "react-icons/bi";
import { FiUser } from "react-icons/fi";
import ContextMenu from "@/components/shared/ContextMenu";
import { reducerCases } from "@/context/constants";
import { useStateProvider } from "@/context/StateContext";

interface ChatHeaderMenuActionsProps {
  detailsOpen: boolean;
  onToggleDetails: () => void;
  onOpenDetails: () => void;
}

export default function ChatHeaderMenuActions({
  detailsOpen,
  onToggleDetails,
  onOpenDetails,
}: ChatHeaderMenuActionsProps) {
  const [{ messageSearch }, dispatch] = useStateProvider();
  const [contextMenuCordinates, setContextMenuCordinates] = useState({
    x: 0,
    y: 0,
  });
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);

  const showContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuCordinates({ x: 22, y: 20 });
    setIsContextMenuVisible(true);
  };

  const contextMenuOptions = [
    {
      name: "Exit",
      callBack: async () => {
        setIsContextMenuVisible(false);
        dispatch({ type: reducerCases.SET_EXIT_CHAT });
      },
    },
  ];

  return (
    <>
      <button
        onClick={() => {
          onOpenDetails();
          if (!messageSearch) {
            dispatch({ type: reducerCases.SET_MESSAGES_SEARCH });
          }
        }}
        className="chat-header-icon desktop-only chat-header-secondary-action"
        aria-label="Search messages"
        type="button"
      >
        <BiSearchAlt2 />
      </button>
      <button
        onClick={onToggleDetails}
        className={`chat-header-icon desktop-only chat-header-secondary-action ${detailsOpen ? "is-active" : ""}`}
        aria-label={detailsOpen ? "Hide details panel" : "Show details panel"}
        type="button"
      >
        <FiUser />
      </button>
      <button
        onClick={(e) => showContextMenu(e)}
        className="chat-header-icon"
        aria-label="More options"
        id="context-opener"
        type="button"
      >
        <BsThreeDotsVertical />
      </button>
      {isContextMenuVisible && (
        <ContextMenu
          options={contextMenuOptions}
          cordinates={contextMenuCordinates}
          contextMenu={isContextMenuVisible}
          setContextMenu={setIsContextMenuVisible}
        />
      )}
    </>
  );
}

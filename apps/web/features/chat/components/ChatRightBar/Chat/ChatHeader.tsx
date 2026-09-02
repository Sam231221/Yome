import Avatar from "@/components/shared/media/Avatar";
import AvatarWithStatus from "@/features/chat/components/avatar-with-status";
import { MdArrowBack } from "react-icons/md";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import ChatHeaderCallActions from "./ChatHeaderCallActions";
import ChatHeaderMenuActions from "./ChatHeaderMenuActions";

interface ChatHeaderProps {
  chatType: string;
  detailsOpen: boolean;
  onToggleDetails: () => void;
  onOpenDetails: () => void;
}

export default function ChatHeader({
  chatType,
  detailsOpen,
  onToggleDetails,
  onOpenDetails,
}: ChatHeaderProps) {
  const [{ currentChatUser, onlineUsers }, dispatch] = useStateProvider();

  const handleBackToList = () => {
    dispatch({ type: reducerCases.SET_EXIT_CHAT });
  };

  return (
    <div className="chat-header">
      <div className="chat-header-main">
        <button
          onClick={handleBackToList}
          className="chat-header-icon mobile-only"
          aria-label="Back to chat list"
          type="button"
        >
          <MdArrowBack />
        </button>
        <div className="chat-header-avatar">
          {chatType === "group" ? (
            <Avatar
              size="lg"
              image={`${
                currentChatUser?.profilePicture || "/avatars/groupprofile.png"
              }`}
            />
          ) : (
            <AvatarWithStatus
              type="user"
              status={`${
                typeof currentChatUser?.id === "number" &&
                onlineUsers.includes(currentChatUser.id)
                  ? "online"
                  : "offline"
              }`}
              size="lg"
              image={`${
                currentChatUser?.profilePicture || "/avatars/userprofile.png"
              }`}
            />
          )}
        </div>
        <div className="chat-header-copy">
          <strong>{currentChatUser?.name}</strong>
          <small>
            {chatType === "group"
              ? currentChatUser?.about || "Collaborative study space"
              : typeof currentChatUser?.id === "number" &&
                  onlineUsers.includes(currentChatUser.id)
                ? "Online now"
                : "Available for messages"}
          </small>
        </div>
      </div>
      <div className="chat-header-actions relative">
        <ChatHeaderCallActions />
        <ChatHeaderMenuActions
          detailsOpen={detailsOpen}
          onToggleDetails={onToggleDetails}
          onOpenDetails={onOpenDetails}
        />
      </div>
    </div>
  );
}

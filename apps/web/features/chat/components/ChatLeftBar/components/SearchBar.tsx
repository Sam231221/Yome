import { BiSearchAlt2 } from "react-icons/bi";
import { useChatState } from "@/features/chat/state/ChatStateContext";
import { chatReducerCases } from "@/features/chat/state/chat-reducer";

export default function SearchBar() {
  const [{ contactSearch }, dispatch] = useChatState();

  return (
    <label className="messages-search">
      <BiSearchAlt2 className="messages-search-icon" />
      <input
        type="text"
        placeholder="Search conversations..."
        value={contactSearch}
        onChange={(e) =>
          dispatch({
            type: chatReducerCases.SET_CONTACT_SEARCH,
            contactSearch: e.target.value,
          })
        }
      />
    </label>
  );
}

import { BiSearchAlt2 } from "react-icons/bi";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";

export default function SearchBar() {
  const [{ contactSearch }, dispatch] = useStateProvider();

  return (
    <label className="messages-search">
      <BiSearchAlt2 className="messages-search-icon" />
      <input
        type="text"
        placeholder="Search conversations..."
        value={contactSearch}
        onChange={(e) =>
          dispatch({
            type: reducerCases.SET_CONTACT_SEARCH,
            contactSearch: e.target.value,
          })
        }
      />
    </label>
  );
}

import { BiSearchAlt2 } from "react-icons/bi";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";

export default function SearchBar() {
  const [{ contactSearch }, dispatch] = useStateProvider();

  return (
    <div className="flex py-2 px-5 items-center gap-3">
      <div className="bg-[#F1F3F9] flex items-center gap-3 px-3 py-2 rounded-xl flex-grow border border-[#E6E8EE]">
        <BiSearchAlt2 className="text-[#6B7280] text-lg" />
        <input
          type="text"
          placeholder="Search Messenger"
          className="bg-transparent text-sm focus:outline-none  w-full text-[#111827] placeholder:text-[#9CA3AF]"
          value={contactSearch}
          onChange={(e) =>
            dispatch({
              type: reducerCases.SET_CONTACT_SEARCH,
              contactSearch: e.target.value,
            })
          }
        />
      </div>
    </div>
  );
}

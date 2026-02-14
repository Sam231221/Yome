import React from "react";
import {
  FiBell,
  FiMessageSquare,
  FiSettings,
  FiShoppingBag,
  FiUsers,
} from "react-icons/fi";
import { FaFacebookMessenger } from "react-icons/fa";
import Avatar from "@/components/common/Avatar";
import { useStateProvider } from "@/context/StateContext";

const navItems = [
  { id: "messages", icon: FiMessageSquare, active: true },
  { id: "people", icon: FiUsers },
  { id: "shop", icon: FiShoppingBag },
  { id: "alerts", icon: FiBell },
];

export default function ChatSideNav() {
  const [{ userInfo }] = useStateProvider();

  return (
    <div className="w-[72px] bg-[#F5F6FA] border-r border-[#E6E8EE] flex flex-col items-center py-4 gap-4">
      <div className="h-11 w-11 rounded-2xl bg-white shadow-sm border border-[#E9ECF3] flex items-center justify-center">
        <FaFacebookMessenger className="text-[#1877F2] text-xl" />
      </div>

      <div className="flex flex-col items-center gap-4 mt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition ${
                item.active
                  ? "bg-white shadow-sm border border-[#E9ECF3] text-[#111827]"
                  : "text-[#6B7280] hover:text-[#111827] hover:bg-white/70"
              }`}
              aria-label={item.id}
            >
              <Icon className="text-lg" />
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col items-center gap-3 pb-3">
        <button
          className="h-10 w-10 rounded-xl flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-white/70"
          aria-label="settings"
        >
          <FiSettings className="text-lg" />
        </button>
        <div className="rounded-full ring-2 ring-white shadow-sm">
          <Avatar
            size="sm"
            image={userInfo?.profilePicture || "/avatars/userprofile.png"}
          />
        </div>
      </div>
    </div>
  );
}

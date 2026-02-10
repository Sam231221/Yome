import React from "react";
import { IoSearchOutline } from "react-icons/io5";
import { BsThreeDots } from "react-icons/bs";
import { contacts } from "./data";
import { Contact } from "./types";

export default function RightSidebar({
  onContactClick,
}: {
  onContactClick?: (contact: Contact) => void;
}) {
  return (
    <div className="space-y-3 pl-1 text-[var(--fb-text)] lg:space-y-4 lg:pl-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-[var(--fb-muted)] lg:text-sm">
          Contacts
        </h4>
        <div className="flex items-center gap-1 text-[var(--fb-muted)] lg:gap-2">
          <button className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[var(--fb-bg)] lg:h-7 lg:w-7 xl:h-8 xl:w-8">
            <IoSearchOutline className="text-sm lg:text-base" />
          </button>
          <button className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[var(--fb-bg)] lg:h-7 lg:w-7 xl:h-8 xl:w-8">
            <BsThreeDots className="text-sm lg:text-base" />
          </button>
        </div>
      </div>

      <div className="space-y-0.5 lg:space-y-1">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            className="flex w-full items-center gap-2 rounded-xl px-1.5 py-1.5 text-left text-xs transition hover:bg-[var(--fb-bg)] lg:gap-3 lg:rounded-2xl lg:px-2 lg:py-2 lg:text-sm"
            onClick={() => onContactClick?.(contact)}
          >
            <div
              className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${contact.gradient} lg:h-9 lg:w-9 xl:h-10 xl:w-10`}
            >
              <span className="text-[10px] font-semibold text-white lg:text-xs">
                {contact.initials}
              </span>
              {contact.online ? (
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-[var(--fb-card)] bg-emerald-500 lg:h-2.5 lg:w-2.5" />
              ) : null}
            </div>
            <span className="min-w-0 truncate">{contact.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

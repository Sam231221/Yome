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
    <div className="space-y-4 pl-2 text-[var(--fb-text)]">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[var(--fb-muted)]">
          Contacts
        </h4>
        <div className="flex items-center gap-2 text-[var(--fb-muted)]">
          <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--fb-bg)]">
            <IoSearchOutline />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--fb-bg)]">
            <BsThreeDots />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left text-sm transition hover:bg-[var(--fb-bg)]"
            onClick={() => onContactClick?.(contact)}
          >
            <div
              className={`relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${contact.gradient}`}
            >
              <span className="text-xs font-semibold text-white">
                {contact.initials}
              </span>
              {contact.online ? (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--fb-card)] bg-emerald-500" />
              ) : null}
            </div>
            <span>{contact.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

import React from "react";
import { BsTelephone, BsCameraVideo, BsX } from "react-icons/bs";
import { Contact, Message } from "./types";

export default function ChatDrawer({
  contact,
  messages,
  onClose,
}: {
  contact: Contact;
  messages: Message[];
  onClose: (contactId: string) => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-[70vh] rounded-t-3xl bg-[var(--fb-card)] shadow-[var(--fb-shadow)] md:hidden">
      <div className="flex items-center justify-between border-b border-[var(--fb-divider)] px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${contact.gradient}`}
          >
            <span className="text-sm font-semibold text-white">
              {contact.initials}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--fb-text)]">
              {contact.name}
            </p>
            <p className="text-xs text-[var(--fb-muted)]">Active now</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[var(--fb-blue)]">
          <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--fb-bg)]">
            <BsTelephone />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--fb-bg)]">
            <BsCameraVideo />
          </button>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--fb-bg)]"
            onClick={() => onClose(contact.id)}
            aria-label="Close chat"
          >
            <BsX />
          </button>
        </div>
      </div>

      <div className="flex h-[calc(70vh-120px)] flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.from === "self" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs ${
                message.from === "self"
                  ? "bg-[var(--fb-blue)] text-white"
                  : "bg-[var(--fb-bg)] text-[var(--fb-text)]"
              }`}
            >
              <p>{message.text}</p>
              <span className="mt-1 block text-[10px] opacity-70">
                {message.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--fb-divider)] px-4 py-3">
        <div className="flex items-center gap-2 rounded-full bg-[var(--fb-bg)] px-3 py-2">
          <input
            type="text"
            placeholder="Write a message"
            className="flex-1 bg-transparent text-xs text-[var(--fb-text)] outline-none placeholder:text-[var(--fb-muted)]"
          />
          <button className="text-xs font-semibold text-[var(--fb-blue)]">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

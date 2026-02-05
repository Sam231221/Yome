import React from "react";
import { BsTelephone, BsCameraVideo, BsDash, BsX } from "react-icons/bs";
import { Contact, Message } from "./types";

export default function ChatWindow({
  contact,
  messages,
  onClose,
  offsetIndex,
}: {
  contact: Contact;
  messages: Message[];
  onClose: (contactId: string) => void;
  offsetIndex: number;
}) {
  const width = 320;
  const gap = 12;
  const rightOffset = 24 + offsetIndex * (width + gap);

  return (
    <div
      className="fixed bottom-6 z-40 hidden flex-col overflow-hidden rounded-2xl bg-[var(--fb-card)] shadow-[var(--fb-shadow)] md:flex"
      style={{ width, right: rightOffset }}
    >
      <div className="flex items-center justify-between border-b border-[var(--fb-divider)] px-3 py-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${contact.gradient}`}
          >
            <span className="text-xs font-semibold text-white">
              {contact.initials}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--fb-text)]">
              {contact.name}
            </p>
            <p className="text-[10px] text-[var(--fb-muted)]">Active now</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[var(--fb-blue)]">
          <button className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--fb-bg)]">
            <BsTelephone />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--fb-bg)]">
            <BsCameraVideo />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--fb-bg)]">
            <BsDash />
          </button>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--fb-bg)]"
            onClick={() => onClose(contact.id)}
            aria-label="Close chat"
          >
            <BsX />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.from === "self" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-3 py-2 text-xs ${
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

      <div className="border-t border-[var(--fb-divider)] px-3 py-2">
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

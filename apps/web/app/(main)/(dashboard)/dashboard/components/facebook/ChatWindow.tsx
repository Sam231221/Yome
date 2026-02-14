import React, { useEffect, useRef, useState } from "react";
import { BsTelephone, BsCameraVideo, BsDash, BsX, BsImage } from "react-icons/bs";
import { BsEmojiSmile, BsMic } from "react-icons/bs";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { calculateTime } from "@/utils/CalculateTime";
import { DashboardChatMessage, DashboardContact } from "./types";

const isImageMessage = (messageType: string) => messageType === "image";
const isAudioMessage = (messageType: string) => messageType === "audio";

export default function ChatWindow({
  contact,
  messages,
  isLoading = false,
  onClose,
  offsetIndex,
  onSendText,
  onSendImage,
  onSendAudio,
  onStartVoiceCall,
  onStartVideoCall,
}: {
  contact: DashboardContact;
  messages: DashboardChatMessage[];
  isLoading?: boolean;
  onClose: (contactId: number) => void;
  offsetIndex: number;
  onSendText: (contactId: number, text: string) => Promise<void> | void;
  onSendImage: (contactId: number, file: File) => Promise<void> | void;
  onSendAudio: (contactId: number, file: File) => Promise<void> | void;
  onStartVoiceCall: (contact: DashboardContact) => void;
  onStartVideoCall: (contact: DashboardContact) => void;
}) {
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const emojiContainerRef = useRef<HTMLDivElement>(null);
  const width = 340;
  const gap = 12;
  const rightOffset = 24 + offsetIndex * (width + gap);

  const handleSendText = async () => {
    const normalizedText = messageText.trim();
    if (!normalizedText || isSending) return;

    try {
      setIsSending(true);
      await onSendText(contact.id, normalizedText);
      setMessageText("");
    } finally {
      setIsSending(false);
    }
  };

  const handleMediaFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "audio"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsSending(true);
      if (type === "image") {
        await onSendImage(contact.id, file);
      } else {
        await onSendAudio(contact.id, file);
      }
    } finally {
      event.target.value = "";
      setIsSending(false);
    }
  };

  useEffect(() => {
    const listEl = messageListRef.current;
    if (!listEl) return;
    listEl.scrollTop = listEl.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!emojiContainerRef.current) return;
      if (!emojiContainerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div
      className="fixed bottom-6 z-40 hidden h-[420px] max-h-[420px] flex-col overflow-hidden rounded-2xl bg-[var(--fb-card)] shadow-[var(--fb-shadow)] md:flex"
      style={{ width, right: rightOffset }}
    >
      <div className="flex items-center justify-between border-b border-[var(--fb-divider)] px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-slate-500">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={contact.profilePicture || "/avatars/userprofile.png"}
              alt={contact.name}
              className="h-full w-full object-cover"
            />
            {contact.online ? (
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-[var(--fb-card)] bg-emerald-500" />
            ) : null}
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--fb-text)]">
              {contact.name}
            </p>
            <p className="text-[10px] text-[var(--fb-muted)]">
              {contact.online ? "Active now" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[var(--fb-blue)]">
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--fb-bg)]"
            onClick={() => onStartVoiceCall(contact)}
            aria-label="Start voice call"
          >
            <BsTelephone />
          </button>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--fb-bg)]"
            onClick={() => onStartVideoCall(contact)}
            aria-label="Start video call"
          >
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

      <div
        ref={messageListRef}
        className="flex-1 min-h-0 space-y-3 overflow-y-auto px-3 py-3"
      >
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`chat-loading-${index}`}
                className="h-10 w-2/3 animate-pulse rounded-2xl bg-[var(--fb-bg)]"
              />
            ))}
          </div>
        ) : (
          messages.map((message) => {
            const isIncoming = message.senderId === contact.id;
            return (
              <div
                key={message.id}
                className={`flex ${isIncoming ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs ${
                    isIncoming
                      ? "bg-[var(--fb-bg)] text-[var(--fb-text)]"
                      : "bg-[var(--fb-blue)] text-white"
                  }`}
                >
                  {isImageMessage(message.type) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={message.message}
                      alt="chat-image"
                      className="max-h-48 w-full rounded-xl object-cover"
                    />
                  ) : null}
                  {isAudioMessage(message.type) ? (
                    <audio controls className="max-w-full">
                      <source src={message.message} />
                    </audio>
                  ) : null}
                  {!isImageMessage(message.type) && !isAudioMessage(message.type) ? (
                    <p className="break-words">{message.message}</p>
                  ) : null}
                  <span className="mt-1 block text-[10px] opacity-70">
                    {calculateTime(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-[var(--fb-divider)] px-3 py-2">
        <div className="flex items-center gap-1 pb-2 text-[var(--fb-blue)]">
          <div className="relative" ref={emojiContainerRef}>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--fb-bg)]"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              aria-label="Toggle emoji picker"
            >
              <BsEmojiSmile />
            </button>
            {showEmojiPicker ? (
              <div className="absolute bottom-10 left-0 z-50">
                <EmojiPicker
                  onEmojiClick={(emojiData) =>
                    setMessageText((prev) => `${prev}${emojiData.emoji}`)
                  }
                  theme={Theme.LIGHT}
                />
              </div>
            ) : null}
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--fb-bg)]"
            onClick={() => imageInputRef.current?.click()}
            aria-label="Send image"
          >
            <BsImage />
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--fb-bg)]"
            onClick={() => audioInputRef.current?.click()}
            aria-label="Send audio"
          >
            <BsMic />
          </button>
          <input
            ref={imageInputRef}
            hidden
            type="file"
            accept="image/*"
            onChange={(event) => handleMediaFile(event, "image")}
          />
          <input
            ref={audioInputRef}
            hidden
            type="file"
            accept="audio/*"
            onChange={(event) => handleMediaFile(event, "audio")}
          />
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[var(--fb-bg)] px-3 py-2">
          <input
            type="text"
            placeholder="Write a message"
            className="flex-1 bg-transparent text-xs text-[var(--fb-text)] outline-none placeholder:text-[var(--fb-muted)]"
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSendText();
              }
            }}
          />
          <button
            className="text-xs font-semibold text-[var(--fb-blue)] disabled:opacity-50"
            onClick={handleSendText}
            disabled={isSending || !messageText.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

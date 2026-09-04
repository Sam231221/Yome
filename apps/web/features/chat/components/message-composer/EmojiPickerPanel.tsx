"use client";

import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";

type EmojiPickerPanelProps = {
  onEmojiSelect: (emoji: string) => void;
};

/**
 * Thin wrapper that owns the `emoji-picker-react` dependency so the composer can
 * load it lazily on first open (see CS-003). Exposes a plain string callback so
 * `MessageSendBar` no longer imports the library or its types directly.
 */
export default function EmojiPickerPanel({ onEmojiSelect }: EmojiPickerPanelProps) {
  return (
    <EmojiPicker
      onEmojiClick={(emoji: EmojiClickData) => onEmojiSelect(emoji.emoji)}
      theme={Theme.LIGHT}
    />
  );
}

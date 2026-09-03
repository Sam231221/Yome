import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { BsEmojiSmile, BsPlusLg } from "react-icons/bs";
import { ImAttachment } from "react-icons/im";
import { FaMicrophone } from "react-icons/fa";
import { MdSend } from "react-icons/md";
import { useAuthState } from "@/features/auth/providers/AuthStateProvider";
import { chatReducerCases } from "@/features/chat/state/chat-reducer";
import { useChatState } from "@/features/chat/state/ChatStateContext";
import PhotoPicker from "@/components/shared/media/PhotoPicker";
import {
  isGroupId,
  type ChatKind,
  type ChatMessage,
  type ChatTargetId,
} from "@/features/chat/types";
import {
  getChatErrorMessage,
  sendImageMessage,
  sendTextMessage as postTextMessage,
} from "@/features/chat/api/chatApi";

const CaptureAudio = dynamic(
  () => import("@/features/chat/components/message-composer/CaptureAudio"),
  {
    ssr: false,
  }
);

interface MessageSendBarProps {
  id: string;
  chatType: string;
}

export default function MessageSendBar({ id, chatType }: MessageSendBarProps) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [grabImage, setGrabImage] = useState(false);
  const [{ userInfo }] = useAuthState();
  const [{ socket, currentChatUser }, chatDispatch] = useChatState();
  const resolvedChatType = (chatType === "group" ? "group" : "user") as ChatKind;

  const emitMessage = (targetId: ChatTargetId, messagePayload: ChatMessage) => {
    socket?.current?.emit("send-msg", {
      chatType: resolvedChatType,
      room: `room-${targetId}`,
      to: targetId,
      from: userInfo?.id,
      message: messagePayload,
    });
  };

  const appendMessage = (messagePayload: ChatMessage) => {
    if (!currentChatUser?.id) return;

    if (resolvedChatType === "user") {
      chatDispatch({
        type: chatReducerCases.ADD_USER_MESSAGE,
        newMessage: messagePayload,
        fromSelf: true,
        currentUserId: userInfo?.id,
      });
      return;
    }

    chatDispatch({
      type: chatReducerCases.ADD_GROUP_MESSAGE,
      newMessage: messagePayload,
      groupId: isGroupId(currentChatUser.id) ? currentChatUser.id : undefined,
      fromSelf: true,
    });
  };

  const photoPickerOnChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !userInfo?.id || !currentChatUser?.id) return;

    try {
      const sentMessage = await sendImageMessage({
        chatType: resolvedChatType,
        from: userInfo.id,
        to: currentChatUser.id,
        file,
      });
      emitMessage(currentChatUser.id, sentMessage);
      appendMessage(sentMessage);
    } catch (error) {
      toast.error(getChatErrorMessage(error, "Failed to send image."));
    }
  };

  const sendTextMessage = async () => {
    const nextMessage = message.trim();
    if (!nextMessage || !userInfo?.id || !currentChatUser?.id) return;

    try {
      setMessage("");
      const sentMessage = await postTextMessage({
        chatType: resolvedChatType,
        from: userInfo.id,
        to: currentChatUser.id,
        message: nextMessage,
      });
      emitMessage(currentChatUser.id, sentMessage);
      appendMessage(sentMessage);
    } catch (error) {
      setMessage(nextMessage);
      toast.error(getChatErrorMessage(error, "Failed to send message."));
    }
  };

  const handleEmojiModal = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiClick = (emoji: EmojiClickData) => {
    setMessage((prevMessage) => (prevMessage += emoji.emoji));
  };

  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.id !== "emoji-open"
      ) {
        if (
          emojiPickerRef.current &&
          !emojiPickerRef.current.contains(event.target)
        ) {
          setShowEmojiPicker(false);
        }
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    setMessage("");
  }, [currentChatUser]);

  useEffect(() => {
    if (grabImage) {
      const data = document.getElementById("photo-picker");
      data?.click();
      document.body.onfocus = () => {
        setTimeout(() => {
          setGrabImage(false);
        }, 1000);
      };
    }
  }, [grabImage]);

  return (
    <div className="message-composer-shell relative">
      {!showAudioRecorder && (
        <>
          <button
            className="composer-plus-button"
            title="More"
            type="button"
          >
            <BsPlusLg />
          </button>
          <div className="message-composer">
            <div className="message-composer-box">
            <textarea
              placeholder="Type a message"
              className="message-composer-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && message.trim()) {
                  e.preventDefault();
                  void sendTextMessage();
                }
              }}
            />
            <div className="message-composer-actions">
              <button
                className="composer-icon-button"
                title="Emoji"
                onClick={handleEmojiModal}
                id="emoji-open"
                type="button"
              >
                <BsEmojiSmile />
              </button>
              {showEmojiPicker && (
                <div
                  className="composer-emoji-picker"
                  ref={emojiPickerRef}
                >
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme={Theme.LIGHT}
                  />
                </div>
              )}
              <button
                className="composer-icon-button"
                title="Attach"
                onClick={() => setGrabImage(true)}
                type="button"
              >
                <ImAttachment />
              </button>
              <span className="message-composer-hint">Enter to send</span>
            </div>
            </div>
            {message.length ? (
              <button
                onClick={() => void sendTextMessage()}
                className="send-button"
                aria-label="Send message"
                type="button"
              >
                <MdSend />
              </button>
            ) : (
              <button
                onClick={() => setShowAudioRecorder(true)}
                className="send-button send-button-muted"
                aria-label="Record audio"
                type="button"
              >
                <FaMicrophone />
              </button>
            )}
          </div>
        </>
      )}
      {showAudioRecorder && (
        <CaptureAudio chatType={resolvedChatType} hide={setShowAudioRecorder} />
      )}
      {grabImage && <PhotoPicker onChange={photoPickerOnChange} />}
    </div>
  );
}

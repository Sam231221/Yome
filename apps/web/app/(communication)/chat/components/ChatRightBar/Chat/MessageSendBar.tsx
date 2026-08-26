import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { BsEmojiSmile, BsPlusLg } from "react-icons/bs";
import { ImAttachment } from "react-icons/im";
import { FaMicrophone } from "react-icons/fa";
import { MdSend } from "react-icons/md";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import PhotoPicker from "@/components/common/PhotoPicker";
import type { ChatKind, ChatMessage, NumericId } from "@/types/chat";
import {
  getChatErrorMessage,
  sendImageMessage,
  sendTextMessage as postTextMessage,
} from "@/lib/chat/chatApi";

const CaptureAudio = dynamic(() => import("@/components/common/CaptureAudio"), {
  ssr: false,
});

interface MessageSendBarProps {
  id: string;
  chatType: string;
}

export default function MessageSendBar({ id, chatType }: MessageSendBarProps) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [grabImage, setGrabImage] = useState(false);
  const [{ socket, currentChatUser, userInfo }, dispatch] = useStateProvider();
  const resolvedChatType = (chatType === "group" ? "group" : "user") as ChatKind;

  const emitMessage = (targetId: NumericId, messagePayload: ChatMessage) => {
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
      dispatch({
        type: reducerCases.ADD_USER_MESSAGE,
        newMessage: messagePayload,
        fromSelf: true,
      });
      return;
    }

    dispatch({
      type: reducerCases.ADD_GROUP_MESSAGE,
      newMessage: messagePayload,
      groupId: currentChatUser.id,
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
    <div className="bg-white lg:h-20 md:h-18 h-16 lg:px-6 md:px-4 px-4 flex items-center gap-2 md:gap-3 lg:gap-4 border-t border-[#E6E8EE] relative">
      {!showAudioRecorder && (
        <>
          <div className="flex gap-2 md:gap-3 items-center flex-shrink-0">
            <button
              className="h-9 w-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center flex-shrink-0 active:bg-[#1565D8] transition-colors"
              title="More"
            >
              <BsPlusLg className="text-sm" />
            </button>
            <button
              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0"
              title="Emoji"
              onClick={handleEmojiModal}
              id="emoji-open"
            >
              <BsEmojiSmile className="text-[#6B7280] text-xl" />
            </button>
            {showEmojiPicker && (
              <div
                className="absolute bottom-20 lg:left-16 md:left-12 left-4 z-40"
                ref={emojiPickerRef}
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme={Theme.LIGHT}
                />
              </div>
            )}
            <button
              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0"
              title="Attach"
              onClick={() => setGrabImage(true)}
            >
              <ImAttachment className="text-[#6B7280] text-xl" />
            </button>
          </div>
          <div className="flex-1 rounded-2xl h-10 flex items-center min-w-0">
            <input
              type="text"
              placeholder="Type a message"
              className="bg-[#F3F5FA] text-sm focus:outline-none h-10 rounded-2xl lg:px-4 md:px-4 px-3 w-full"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && message.trim()) {
                  void sendTextMessage();
                }
              }}
            />
          </div>
          <div className="flex items-center justify-center flex-shrink-0">
            {message.length ? (
              <button
                onClick={() => void sendTextMessage()}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                aria-label="Send message"
              >
                <MdSend className="text-[#1877F2] text-xl" />
              </button>
            ) : (
              <button
                onClick={() => setShowAudioRecorder(true)}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                aria-label="Record audio"
              >
                <FaMicrophone className="text-[#1877F2] text-xl" />
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

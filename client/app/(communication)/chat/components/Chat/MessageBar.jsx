import React, { useEffect, useRef, useState } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { ImAttachment } from "react-icons/im";
import { FaMicrophone } from "react-icons/fa";
import { MdSend } from "react-icons/md";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import axios from "axios";
import { ADD_IMAGE_MESSAGE_ROUTE, ADD_MESSAGE_ROUTE } from "@/utils/ApiRoutes";
import EmojiPicker from "emoji-picker-react";
import dynamic from "next/dynamic";
import PhotoPicker from "@/components/common/PhotoPicker";

const CaptureAudio = dynamic(() => import("@/components/common/CaptureAudio"), {
  ssr: false,
});

export default function MessageBar({ id, chatType }) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [grabImage, setGrabImage] = useState(false);
  const [{ socket, currentChatUser, userInfo }, dispatch] = useStateProvider();
  //send image message
  const photoPickerOnChange = async (e) => {
    const file = e.target.files[0];

    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await axios.post(ADD_IMAGE_MESSAGE_ROUTE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          from: userInfo.id,
          to: currentChatUser.id,
        },
      });
      //render image message at the time.
      if (response.status === 201) {
        socket.current.emit("send-msg", {
          to: currentChatUser.id,
          from: userInfo.id,
          message: response.data.message,
        });
        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: {
            ...response.data.message,
          },
          fromSelf: true,
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  //send text message
  const sendTextMessage = async () => {
    try {
      setMessage("");
      const { data } = await axios.post(
        "http://localhost:3005/api/messages/add-message",
        {
          chatType: chatType,
          from: userInfo.id,
          to: currentChatUser.id,
          message,
        }
      );
      console.log("puti/.");
      socket.current.emit("send-msg", {
        chatType: chatType,
        from: userInfo.id,
        room: `room-${currentChatUser.id}`,
        to: currentChatUser.id,
        message: data.message,
      });
      if (chatType === "user") {
        //add msg real time from sender side through dispatch().
        dispatch({
          type: reducerCases.ADD_USER_MESSAGE,
          newMessage: {
            ...data.message,
          },
          //it means logged in user is sender
          fromSelf: true,
        });
      }
      if (chatType === "group") {
        //add msg real time from sender side through dispatch().
        dispatch({
          type: reducerCases.ADD_GROUP_MESSAGE,
          newMessage: {
            ...data.message,
          },
          groupId: currentChatUser.id,
          //it means logged in user is sender
          fromSelf: true,
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleEmojiModal = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  //just append emoji to text message.
  const handleEmojiClick = (emoji, event) => {
    setMessage((prevMessage) => (prevMessage += emoji.emoji));
  };

  // Create a ref for the emoji picker element
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (event.target.id !== "emoji-open") {
        if (
          emojiPickerRef.current && // Check if the emoji picker ref exists
          !emojiPickerRef.current.contains(event.target) // Check if the click is outside of the emoji picker
        ) {
          setShowEmojiPicker(false); // Close the emoji picker
        }
      }
    };

    document.addEventListener("click", handleOutsideClick); // Add the event listener
    // Clean up the event listener on component unmount
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
      data.click();
      document.body.onfocus = (e) => {
        setTimeout(() => {
          setGrabImage(false);
        }, 1000);
      };
    }
  }, [grabImage]);

  return (
    <div className="bg-white  h-20 px-4 flex items-center gap-6  relative">
      {!showAudioRecorder && (
        <>
          <div className="flex gap-6">
            <BsEmojiSmile
              className="text-panel-header-icon cursor-pointer text-xl"
              title="Emoji"
              onClick={handleEmojiModal}
              id="emoji-open"
            />
            {showEmojiPicker && (
              <div
                className="absolute bottom-24 left-16 z-40"
                ref={emojiPickerRef}
              >
                <EmojiPicker onEmojiClick={handleEmojiClick} theme="light" />
              </div>
            )}
            <ImAttachment
              className="text-panel-header-icon cursor-pointer text-xl"
              title="Attach"
              onClick={() => setGrabImage(true)}
            />
          </div>
          <div className="w-full rounded-lg h-10 flex items-center">
            <input
              type="text"
              placeholder="Type a message"
              className="bg-input-background text-sm focus:outline-none  h-10 rounded-lg pl-5 pr-5 py-4 w-full"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className=" w-10 flex items-center justify-center">
            {message.length ? (
              <button onClick={sendTextMessage}>
                <MdSend
                  className="text-panel-header-icon cursor-pointer text-xl"
                  title="Send"
                />
              </button>
            ) : (
              <FaMicrophone
                className="text-panel-header-icon cursor-pointer text-xl"
                title="Record"
                onClick={() => setShowAudioRecorder(true)}
              />
            )}
          </div>
        </>
      )}
      {showAudioRecorder && <CaptureAudio hide={setShowAudioRecorder} />}
      {grabImage && <PhotoPicker onChange={photoPickerOnChange} />}
    </div>
  );
}

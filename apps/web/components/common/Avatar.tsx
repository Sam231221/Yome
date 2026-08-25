import React, { useEffect, useState } from "react";

import { FaCamera } from "react-icons/fa";
import ContextMenu from "./ContextMenu";
import PhotoPicker from "./PhotoPicker";
import PhotoLibrary from "./PhotoLibrary";
import CapturePhoto from "./CapturePhoto";
import Image from "next/image";

interface AvatarProps {
  type?: string;
  size?: string;
  image: string;
  setImage?: (image: string) => void;
  classNames?: string;
}
export default function Avatar({
  type,
  size,
  classNames,
  image,
  setImage,
}: AvatarProps) {
  const [hover, setHover] = useState(false);
  const [showPhotoLibrary, setShowPhotoLibrary] = useState(false);
  const [grabImage, setGrabImage] = useState(false);
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [isFirstRun, setIsFirstRun] = useState(true);
  const [showCapturePhoto, setShowCapturePhoto] = useState(false);
  const [contextMenuCordinates, setContextMenuCordinates] = useState({
    x: 0,
    y: 0,
  });

  const contextMenuOptions = [
    {
      name: "Take Photo",
      callBack: () => {
        setIsContextMenuVisible(false);
        setShowCapturePhoto(true);
      },
    },
    {
      name: "Choose from Library",
      callBack: () => {
        setIsContextMenuVisible(false);
        setShowPhotoLibrary(true);
      },
    },
    {
      name: "Upload Photo",
      callBack: () => {
        setIsContextMenuVisible(false);
        setGrabImage(true);
      },
    },
    {
      name: "Remove Photo",
      callBack: () => {
        setIsContextMenuVisible(false);
        if (setImage) {
          setImage("/default_avatar.png");
        }
      },
    },
  ];

  useEffect(() => {
    if (grabImage) {
      const data = document.getElementById("photo-picker");
      data?.click();
      document.body.onfocus = (e) => {
        setGrabImage(false);
      };
    }
  }, [grabImage]);

  useEffect(() => {
    const handleClick = () => {
      if (!isFirstRun) {
        setIsContextMenuVisible(false);
        setIsFirstRun(true);
      } else setIsFirstRun(false);
    };
    if (isContextMenuVisible) {
      window.addEventListener("click", handleClick);
    }
    return () => window.removeEventListener("click", handleClick);
  }, [isContextMenuVisible, isFirstRun]);

  const showContextMenu = (e: React.MouseEvent<SVGElement | HTMLElement>) => {
    e.preventDefault();
    setContextMenuCordinates({ x: e.pageX, y: e.pageY });
    setIsContextMenuVisible(true);
  };

  const photoPickerOnChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;
    const file = files[0];
    const reader = new FileReader();
    const data = document.createElement("img");
    reader.onload = function (event) {
      if (event.target) {
        data.src = event.target.result as string;
      }
      if (event.target && typeof event.target.result === "string") {
        data.setAttribute("data-src", event.target.result);
      }
    };
    reader.readAsDataURL(file);
    setTimeout(() => {
      if (setImage) {
        setImage(data.src);
      }
    }, 100);
  };

  return (
    <>
      <div className="flex items-center justify-center">
        {size === "sm" && (
          <div className="relative h-11 w-11 rounded-full bg-white overflow-hidden">
            <Image
              fill
              src={image}
              loading="lazy"
              alt="avatar"
              sizes="44px"
              className="object-cover rounded-full"
            />
          </div>
        )}
        {size === "lg" && (
          <div className="relative h-14 w-14 rounded-full bg-white overflow-hidden">
            <Image
              fill
              src={image}
              loading="lazy"
              alt="avatar"
              sizes="56px"
              className="object-cover rounded-full"
            />
          </div>
        )}
        {size === "xl" && (
          // avatar with text on hover
          <div
            className="relative cursor-pointer z-0"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            {/* Hover effect txt */}
            <div
              className={`bg-photopicker-overlay-background h-60 w-60 absolute top-0 left-0 rounded-full flex items-center justify-center flex-col text-center gap-2 ${
                hover ? "visible" : "hidden"
              }`}
              id="context-opener"
              onClick={(e) => showContextMenu(e)}
            >
              <FaCamera
                className="text-2xl"
                id="context-opener"
                onClick={(e) => showContextMenu(e)}
              />
              <span
                className=""
                id="context-opener"
                onClick={(e) => showContextMenu(e)}
              >
                Change <br></br> Profile <br></br> Photo
              </span>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-60 w-60 overflow-hidden rounded-full">
                <Image
                  fill
                  src={image}
                  alt="avatar"
                  sizes="240px"
                  className="rounded-full object-cover"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {isContextMenuVisible && (
        <ContextMenu
          options={contextMenuOptions}
          cordinates={contextMenuCordinates}
          contextMenu={isContextMenuVisible}
          setContextMenu={setIsContextMenuVisible}
        />
      )}
      {grabImage && <PhotoPicker onChange={photoPickerOnChange} />}
      {showPhotoLibrary && (
        <PhotoLibrary
          setImage={setImage}
          hidePhotoLibrary={setShowPhotoLibrary}
        />
      )}
      {showCapturePhoto && (
        <CapturePhoto setImage={setImage} hide={setShowCapturePhoto} />
      )}
    </>
  );
}

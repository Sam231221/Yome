"use client";
import Image from "next/image";
import React, { useRef, useEffect, useState } from "react";

const DropZoneUploader = ({ classes, setThumbnail }) => {
  const inputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const imageViewRef = useRef(null);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const dropZone = dropZoneRef.current;
    const imageFile = inputRef.current;

    const uploadImage = () => {
      const imageUrl = URL.createObjectURL(imageFile.files[0]);
      setImageUrl(imageUrl);
      setThumbnail(imageFile.files[0]);

      const imageView = document.getElementById("imageView");
      imageView.style.backgroundImage = `url(${imageUrl})`;
      imageView.style.border = "0";
    };
    imageFile.addEventListener("change", uploadImage);
    const dragoverHandler = (e) => {
      e.preventDefault();
    };

    const dropHandler = (e) => {
      e.preventDefault();
      imageFile.files = e.dataTransfer.files;
      console.log(imageFile.files);
      uploadImage();
    };

    dropZone.addEventListener("dragover", dragoverHandler);
    dropZone.addEventListener("drop", dropHandler);
    return () => {
      imageFile.removeEventListener("change", uploadImage);
      dropZone.removeEventListener("dragover", dragoverHandler);
      dropZone.removeEventListener("drop", dropHandler);
    };
  }, []);

  return (
    <div className={classes}>
      <label
        htmlFor="imageFile"
        id="dropZone"
        ref={dropZoneRef}
        className="block w-full h-[400px] bg-white text-center rounded-2xl"
      >
        <input
          type="file"
          accept="image/*"
          id="imageFile"
          hidden
          ref={inputRef}
        />
        <div
          id="imageView"
          ref={imageViewRef}
          className={`w-full h-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100 ${
            imageUrl ? "bg-cover bg-center" : ""
          }`}
        >
          {imageUrl ? null : (
            <>
              <Image
                width={64}
                height={64}
                id="imageFile"
                src="/images/dropZone.png"
                loading="lazy"
                alt="dropzoneicon"
                className="object-cover mx-auto"
              />
              <p className="text-sm font-medium text-gray-700 mt-2">
                Drag/Drop or Double click here
                <br />
                to upload
              </p>
            </>
          )}
        </div>
      </label>
    </div>
  );
};

export default DropZoneUploader;

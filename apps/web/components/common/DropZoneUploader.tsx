"use client";
import Image from "next/image";
import React, { useRef, useEffect, useState } from "react";

type DropZoneUploaderProps = {
  classes?: string;
  setThumbnail: (file: File) => void;
};

const DropZoneUploader = ({ classes, setThumbnail }: DropZoneUploaderProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLLabelElement | null>(null);
  const imageViewRef = useRef<HTMLDivElement | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const dropZone = dropZoneRef.current;
    const imageFile = inputRef.current;
    if (!dropZone || !imageFile) return;

    const uploadImage = () => {
      const files = imageFile.files;
      if (!files?.length) return;
      const file = files[0];
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setThumbnail(file);

      const imageView = document.getElementById("imageView");
      if (imageView) {
        imageView.style.backgroundImage = `url(${url})`;
        imageView.style.border = "0";
      }
    };
    imageFile.addEventListener("change", uploadImage);
    const dragoverHandler = (e: DragEvent) => {
      e.preventDefault();
    };

    const dropHandler = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.files) imageFile.files = e.dataTransfer.files;
      uploadImage();
    };

    dropZone.addEventListener("dragover", dragoverHandler);
    dropZone.addEventListener("drop", dropHandler);
    return () => {
      imageFile.removeEventListener("change", uploadImage);
      dropZone.removeEventListener("dragover", dragoverHandler);
      dropZone.removeEventListener("drop", dropHandler);
    };
  }, [setThumbnail]);

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

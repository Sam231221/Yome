import Slider from "@/components/common/Slider/Slider";
import React, { useState } from "react";
import Cropper from "react-easy-crop";

import getCroppedImg from "./cropImage";
const zoomPercent = (value) => {
  return `${Math.round(value * 100)}%`;
};

const CropEasy = ({ photo, setOpenCrop, setPhoto, setFile }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const cropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const cropImage = async () => {
    try {
      const result = (await getCroppedImg(
        photo,
        croppedAreaPixels,
        rotation
      )) as { file: Blob | null; url: string };
      const { file, url } = result;
      setPhoto(url);
      setFile(file);
      setOpenCrop(false);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="absolute top-0 right-0 w-full h-full bg-black bg-opacity-60 flex items-center justify-center ">
      <div className="min-w-[300px]  bg-white ">
        <div className="w-[300px] bg-[#333] relative h-[300px]">
          <Cropper
            image={photo}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropChange={setCrop}
            onCropComplete={cropComplete}
          />
        </div>
        <div className="mx-3 my-2 flex-col">
          <div style={{ width: "100%" }}>
            <div className="mb-2">
              <h1>Zoom: {zoomPercent(zoom)}</h1>
              <Slider
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e, zoom) => setZoom(zoom)}
              />
            </div>
            <div className="mb-2">
              <h1>Rotation: {rotation + "°"}</h1>
              <Slider
                min={0}
                max={360}
                step={1}
                value={rotation}
                onChange={(e, rotation) => setRotation(rotation)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="bg-red-500 hover:bg-red-600 rounded-lg text-lg py-2 px-3 text-white"
              onClick={() => setOpenCrop(false)}
            >
              Cancel
            </button>
            <button
              className="bg-sky-500 hover:bg-sky-600 rounded-lg text-lg py-2 px-3 text-white"
              onClick={cropImage}
            >
              Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropEasy;

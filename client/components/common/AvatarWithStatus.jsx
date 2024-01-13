import React from "react";

export default function AvatarWithStatus({ type, image, status }) {
  return (
    <>
      {type == "lg" && (
        <figure>
          <figcaption
            className="w-[25px] h-[25px] before:w-[18px] before:h-[18px] before:top-[22px] before:left-[25px]"
            data-status={status}
          >
            32teeth
          </figcaption>
          <picture className="w-[50px] h-[50px]">
            <img src={image} />
          </picture>
        </figure>
      )}
      {type == "sm" && (
        <figure>
          <figcaption
            className="w-[20px] h-[20px]  before:w-[14px] before:h-[14px] before:top-[17px] before:left-[17px]"
            data-status={status}
          >
            32teeth
          </figcaption>
          <picture className="w-[45px] h-[45px]">
            <img src={image} />
          </picture>
        </figure>
      )}
    </>
  );
}

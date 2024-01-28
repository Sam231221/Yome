import React from "react";

export default function AvatarWithStatus({ type, image, status }) {
  return (
    <>
      {type == "lg" && (
        <figure>
          <figcaption
            className="w-6 h-6 before:w-4 before:h-4 before:top-5 before:left-6"
            data-status={status}
          >
            32teeth
          </figcaption>
          <picture className="w-12 h-12">
            <img src={image} />
          </picture>
        </figure>
      )}
      {type == "sm" && (
        <figure>
          <figcaption
            className="w-5 h-5  before:w-[12px] before:h-[12px] before:top-[15px] before:left-[12px]"
            data-status={status}
          >
            32teeth
          </figcaption>
          <picture className="w-11 h-11">
            <img src={image} />
          </picture>
        </figure>
      )}
    </>
  );
}

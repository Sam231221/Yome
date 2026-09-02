import React from "react";

const cn = (...inputs: Array<string | undefined>) => inputs.filter(Boolean).join(" ");

interface AvatarWithStatusProps {
  type?: string;
  size: string;
  classNames?: string;
  image: string;
  status: string;
}
export default function AvatarWithStatus({
  type,
  size,
  classNames,
  image,
  status,
}: AvatarWithStatusProps) {
  return (
    <>
      {size == "lg" && (
        <figure>
          <figcaption
            className={cn(
              "w-6 h-6 before:w-4 before:h-4 before:top-5 before:left-6",
              classNames
            )}
            data-status={status}
          >
            32teeth
          </figcaption>
          <picture className="w-12 h-12">
            <img src={image} />
          </picture>
        </figure>
      )}
      {size == "sm" && (
        <figure>
          <figcaption
            className={cn(
              "w-5 h-5  before:w-[12px] before:h-[12px] before:top-[15px] before:left-[12px]",
              classNames
            )}
            data-status={status}
          >
            32teeth
          </figcaption>
          <picture className={cn("w-11 h-11", classNames)}>
            <img src={image} />
          </picture>
        </figure>
      )}
    </>
  );
}

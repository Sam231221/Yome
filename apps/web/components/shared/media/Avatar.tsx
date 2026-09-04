import Image from "next/image";

interface AvatarProps {
  type?: string;
  size?: "sm" | "lg";
  image: string;
  classNames?: string;
}

export default function Avatar({ size = "sm", image, classNames }: AvatarProps) {
  const dimensions = size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const sizes = size === "lg" ? "56px" : "44px";

  return (
    <div className="flex items-center justify-center">
      <div
        className={`relative overflow-hidden rounded-full bg-white ${dimensions} ${
          classNames ?? ""
        }`}
      >
        <Image
          fill
          src={image}
          loading="lazy"
          alt="avatar"
          sizes={sizes}
          className="rounded-full object-cover"
        />
      </div>
    </div>
  );
}

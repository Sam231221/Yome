import React from "react";
import Image from "next/image";
import { BiHappy, BiImage, BiVideo } from "react-icons/bi";
import { UserLite } from "./types";

export default function ComposerCard({ user }: { user: UserLite }) {
  return (
    <div className="rounded-2xl bg-[var(--fb-card)] p-4 shadow-[var(--fb-shadow)]">
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 overflow-hidden rounded-full border border-[var(--fb-divider)]">
          <Image
            src={user.avatarUrl}
            alt={user.name}
            fill
            sizes="44px"
            priority
            className="object-cover"
          />
        </div>
        <button className="flex-1 rounded-full bg-[var(--fb-bg)] px-4 py-2 text-left text-sm text-[var(--fb-muted)]">
          What&apos;s on your mind, {user.name.split(" ")[0]}?
        </button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--fb-divider)] pt-3 text-xs text-[var(--fb-muted)]">
        <button className="flex items-center justify-center gap-2 rounded-xl py-2 transition hover:bg-[var(--fb-bg)]">
          <BiVideo className="text-lg text-red-500" />
          Live video
        </button>
        <button className="flex items-center justify-center gap-2 rounded-xl py-2 transition hover:bg-[var(--fb-bg)]">
          <BiImage className="text-lg text-green-500" />
          Photo/video
        </button>
        <button className="flex items-center justify-center gap-2 rounded-xl py-2 transition hover:bg-[var(--fb-bg)]">
          <BiHappy className="text-lg text-yellow-500" />
          Feeling/activity
        </button>
      </div>
    </div>
  );
}

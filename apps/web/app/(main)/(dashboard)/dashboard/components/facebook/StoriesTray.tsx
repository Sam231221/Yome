import React from "react";
import Image from "next/image";
import { FiPlus } from "react-icons/fi";
import { stories } from "./data";
import { UserLite } from "./types";

export default function StoriesTray({ user }: { user: UserLite }) {
  return (
    <div className="rounded-2xl bg-[var(--fb-card)] p-3 shadow-[var(--fb-shadow)]">
      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
        <div className="relative flex h-44 min-w-[120px] flex-col overflow-hidden rounded-2xl bg-[var(--fb-bg)]">
          <div className="h-3/4">
            <Image
              src={user.avatarUrl}
              alt={user.name}
              width={120}
              height={120}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-1 bg-[var(--fb-card)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fb-blue)] text-white">
              <FiPlus />
            </span>
            <span className="text-xs font-semibold text-[var(--fb-text)]">
              Create story
            </span>
          </div>
        </div>

        {stories.map((story) => (
          <div
            key={story.id}
            className={`relative flex h-44 min-w-[120px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${story.gradient}`}
          >
            <div
              className={`m-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--fb-card)] bg-gradient-to-br ${story.avatarGradient}`}
            />
            <div className="p-3">
              <p className="text-xs font-semibold text-white">{story.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

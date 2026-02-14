import React from "react";
import { reels } from "./data";
import SectionHeader from "./SectionHeader";

export default function ReelsTray() {
  return (
    <div className="rounded-2xl bg-[var(--fb-card)] p-4 shadow-[var(--fb-shadow)]">
      <SectionHeader title="Reels" actionLabel="See all" />
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
        {reels.map((reel) => (
          <div
            key={reel.id}
            className={`relative flex h-48 min-w-[150px] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br ${reel.gradient}`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="relative p-3">
              <p className="text-xs font-semibold text-white">{reel.title}</p>
              <p className="text-[10px] text-white/80">{reel.creator}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

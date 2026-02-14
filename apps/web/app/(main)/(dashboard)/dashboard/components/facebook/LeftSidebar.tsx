import React from "react";
import Image from "next/image";
import { navItems, shortcutItems } from "./data";
import { UserLite } from "./types";

export default function LeftSidebar({ user }: { user: UserLite }) {
  return (
    <div className="space-y-6 pr-2 text-[var(--fb-text)]">
      <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-[var(--fb-bg)]">
        <div className="h-10 w-10 overflow-hidden rounded-full border border-[var(--fb-divider)]">
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="text-xs text-[var(--fb-muted)]">View your profile</p>
        </div>
      </button>

      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm transition hover:bg-[var(--fb-bg)]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fb-bg)] text-[var(--fb-blue)]">
                <Icon className="text-lg" />
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--fb-muted)]">
            Your shortcuts
          </h4>
        </div>
        <div className="space-y-2">
          {shortcutItems.map((item) => (
            <button
              key={item.id}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-[var(--fb-bg)]"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient}`}
              >
                <span className="text-xs font-semibold text-white">
                  {item.label
                    .split(" ")
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join("")}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-[var(--fb-muted)]">Shortcut</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

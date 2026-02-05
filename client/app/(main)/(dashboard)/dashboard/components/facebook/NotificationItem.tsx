import React from "react";
import { NotificationItem as NotificationItemType } from "./types";

export default function NotificationItem({
  item,
}: {
  item: NotificationItemType;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl px-2 py-3 transition hover:bg-[var(--fb-bg)]">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${item.iconGradient}`}
      />
      <div className="flex-1">
        <p className="text-sm text-[var(--fb-text)]">
          <span className="font-semibold">{item.title}</span> {item.description}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--fb-blue)]">
          <span className="font-medium">{item.time}</span>
        </div>
        {item.actions ? (
          <div className="mt-2 flex gap-2">
            <button className="rounded-xl bg-[var(--fb-blue)] px-4 py-2 text-xs font-semibold text-white">
              {item.actions.primary}
            </button>
            {item.actions.secondary ? (
              <button className="rounded-xl bg-[var(--fb-bg)] px-4 py-2 text-xs font-semibold text-[var(--fb-text)]">
                {item.actions.secondary}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {item.isUnread ? (
        <span className="mt-2 inline-flex h-2.5 w-2.5 rounded-full bg-[var(--fb-blue)]" />
      ) : null}
    </div>
  );
}

import React, { useMemo, useRef } from "react";
import { notifications } from "./data";
import NotificationItem from "./NotificationItem";
import useOnClickOutside from "./hooks/useOnClickOutside";

export default function NotificationsPanel({
  onClose,
  triggerRef,
}: {
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useOnClickOutside([panelRef, triggerRef], onClose, true);

  const grouped = useMemo(() => {
    return {
      newItems: notifications.filter((item) => item.isNew),
      earlierItems: notifications.filter((item) => !item.isNew),
    };
  }, []);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 z-40 w-[90vw] max-w-[360px] max-h-[70vh] overflow-y-auto rounded-2xl bg-[var(--fb-card)] p-4 shadow-[var(--fb-shadow)]"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--fb-text)]">
          Notifications
        </h3>
        <button className="text-xs font-medium text-[var(--fb-blue)]">
          See all
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <button className="rounded-full bg-[var(--fb-blue)]/10 px-3 py-1 text-xs font-semibold text-[var(--fb-blue)]">
          All
        </button>
        <button className="rounded-full bg-[var(--fb-bg)] px-3 py-1 text-xs font-semibold text-[var(--fb-muted)]">
          Unread
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-[var(--fb-text)]">New</h4>
        </div>
        <div className="mt-2 space-y-2">
          {grouped.newItems.map((item) => (
            <NotificationItem key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-[var(--fb-text)]">
            Earlier
          </h4>
        </div>
        <div className="mt-2 space-y-2">
          {grouped.earlierItems.map((item) => (
            <NotificationItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

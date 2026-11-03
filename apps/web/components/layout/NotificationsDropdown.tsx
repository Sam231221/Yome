"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { YomeIcon } from "@/components/ui";
import {
  getNotifications,
  getNotificationsErrorMessage,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/notifications/notificationsApi";
import { timeAgo } from "@/lib/notifications/time";

type NotificationsDropdownProps = {
  unreadCount: number;
  onUnreadChange: (count: number) => void;
};

export function NotificationsDropdown({
  unreadCount,
  onUnreadChange,
}: NotificationsDropdownProps) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const page = await getNotifications({ limit: 8 });
      setItems(page.notifications);
      onUnreadChange(page.unreadCount);
    } catch (loadError) {
      setError(getNotificationsErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [onUnreadChange]);

  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const onItemClick = async (item: NotificationItem) => {
    if (item.read) return;
    setItems((current) =>
      current.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    onUnreadChange(Math.max(0, unreadCount - 1));
    try {
      const { unreadCount: fresh } = await markNotificationRead(item.id);
      onUnreadChange(fresh);
    } catch {
      void load();
    }
  };

  const onMarkAll = async () => {
    setItems((current) => current.map((n) => ({ ...n, read: true })));
    onUnreadChange(0);
    try {
      await markAllNotificationsRead();
    } catch {
      void load();
    }
  };

  return (
    <div className="notification-wrapper" ref={rootRef}>
      <button
        type="button"
        className="yome-icon-button icon-button notification-button inline-grid shrink-0 place-items-center rounded-yome border border-yome-border bg-yome-surface text-yome-muted"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <YomeIcon name="bell" size={20} />
        {unreadCount > 0 ? (
          <span className="notification-dot">{unreadCount > 99 ? "99+" : unreadCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className="notification-menu" role="menu" aria-label="Notifications">
          <div className="notification-menu-header">
            <strong>Notifications</strong>
            <button
              type="button"
              onClick={onMarkAll}
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
          </div>
          <div className="notification-menu-body">
            {isLoading && items.length === 0 ? (
              <p className="notification-menu-state">Loading notifications…</p>
            ) : error ? (
              <p className="notification-menu-state error">{error}</p>
            ) : items.length === 0 ? (
              <p className="notification-menu-state">You&apos;re all caught up.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className={`notification-menu-item${item.read ? "" : " unread"}`}
                  onClick={() => void onItemClick(item)}
                >
                  <span className="notification-menu-indicator" aria-hidden="true" />
                  <span className="notification-menu-copy">
                    <strong>{item.title}</strong>
                    {item.body ? <small>{item.body}</small> : null}
                  </span>
                  <time dateTime={item.createdAt}>{timeAgo(item.createdAt)}</time>
                </button>
              ))
            )}
          </div>
          <Link className="notification-menu-footer" href="/notifications">
            View all notifications
          </Link>
        </div>
      ) : null}
    </div>
  );
}

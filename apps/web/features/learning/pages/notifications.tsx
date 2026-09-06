"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui";
import {
  getNotifications,
  getNotificationsErrorMessage,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/notifications/notificationsApi";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(1, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function NotificationsContent() {
  const { status } = useSession();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (status !== "authenticated") return;
    setIsLoading(true);
    setError("");
    try {
      const page = await getNotifications();
      setItems(page.notifications);
      setUnreadCount(page.unreadCount);
    } catch (loadError) {
      setError(getNotificationsErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setIsLoading(false);
      setError("Sign in to see your notifications.");
      return;
    }
    void load();
  }, [status, load]);

  const onOpen = async (item: NotificationItem) => {
    if (item.read) return;
    setItems((current) =>
      current.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      const { unreadCount: fresh } = await markNotificationRead(item.id);
      setUnreadCount(fresh);
    } catch {
      void load();
    }
  };

  const onMarkAll = async () => {
    setItems((current) => current.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      void load();
    }
  };

  return (
    <div className="yome-page yome-page-narrow min-w-0 text-yome-text">
      <div className="yome-page-heading flex items-end justify-between gap-5">
        <div>
          <p>Notifications</p>
          <h1>What needs your attention</h1>
          <span>Learning updates, messages, follows, and accepted answers.</span>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 ? <Badge>{unreadCount} unread</Badge> : null}
          <button
            type="button"
            onClick={onMarkAll}
            disabled={unreadCount === 0}
            className="text-sm text-yome-muted underline-offset-2 hover:underline disabled:opacity-40"
          >
            Mark all read
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-yome-muted">Loading notifications…</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-yome-muted">You&apos;re all caught up.</p>
      ) : (
        <div className="yome-list">
          {items.map((item) => (
            <article
              key={item.id}
              onClick={() => void onOpen(item)}
              className={`yome-card yome-section cursor-pointer rounded-yome border bg-yome-surface shadow-yome transition ${
                item.read
                  ? "border-yome-border opacity-70"
                  : "border-yome-blue"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="yome-card-title">{item.title}</h2>
                  {item.body ? (
                    <p className="mt-1 truncate text-sm text-yome-muted">
                      {item.body}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-yome-muted">
                  {timeAgo(item.createdAt)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

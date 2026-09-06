import axios from "axios";
import {
  NOTIFICATIONS_LIST_ROUTE,
  NOTIFICATIONS_READ_ALL_ROUTE,
} from "@/utils/ApiRoutes";
import { getClientErrorMessage } from "@/lib/api/clientErrors";

/** One notification record as returned by `GET /api/notifications` (services/notifications). */
export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

export type NotificationsPage = {
  notifications: NotificationItem[];
  unreadCount: number;
  nextCursor: string | null;
};

const requestConfig = { withCredentials: true };

type RawNotification = Partial<NotificationItem> & { id: string };

const normalize = (raw: RawNotification): NotificationItem => ({
  id: String(raw.id),
  type: String(raw.type ?? "unknown"),
  title: String(raw.title ?? "Notification"),
  body: String(raw.body ?? ""),
  payload:
    raw.payload && typeof raw.payload === "object"
      ? (raw.payload as Record<string, unknown>)
      : {},
  read: Boolean(raw.read),
  createdAt: String(raw.createdAt ?? new Date().toISOString()),
});

export const getNotificationsErrorMessage = (
  error: unknown,
  fallback = "Unable to load notifications."
) => getClientErrorMessage(error, fallback);

export const getNotifications = async (options?: {
  unread?: boolean;
  limit?: number;
  cursor?: string;
}): Promise<NotificationsPage> => {
  const { data } = await axios.get(NOTIFICATIONS_LIST_ROUTE, {
    ...requestConfig,
    params: {
      ...(options?.unread ? { unread: "true" } : {}),
      ...(options?.limit ? { limit: options.limit } : {}),
      ...(options?.cursor ? { cursor: options.cursor } : {}),
    },
  });

  const page = (data?.data ?? {}) as {
    notifications?: RawNotification[];
    unreadCount?: number;
    nextCursor?: string | null;
  };

  return {
    notifications: (page.notifications ?? []).map(normalize),
    unreadCount: Number(page.unreadCount ?? 0),
    nextCursor: page.nextCursor ?? null,
  };
};

export const markNotificationRead = async (
  id: string
): Promise<{ unreadCount: number }> => {
  const { data } = await axios.post(
    `${NOTIFICATIONS_LIST_ROUTE}/${encodeURIComponent(id)}/read`,
    {},
    requestConfig
  );
  return { unreadCount: Number(data?.data?.unreadCount ?? 0) };
};

export const markAllNotificationsRead = async (): Promise<{
  unreadCount: number;
}> => {
  const { data } = await axios.post(
    NOTIFICATIONS_READ_ALL_ROUTE,
    {},
    requestConfig
  );
  return { unreadCount: Number(data?.data?.unreadCount ?? 0) };
};

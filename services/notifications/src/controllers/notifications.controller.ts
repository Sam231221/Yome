import type { NextFunction, Request, Response } from "express";
import { getAuthenticatedUserId } from "@repo/contracts";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../store/notificationStore.js";

interface SendBody {
  channel?: string;
  to?: string;
  template?: string;
  payload?: Record<string, unknown>;
}

/**
 * Stub: accepts a direct send request and returns 202. The primary path is now event
 * consumption (see ../consumer); this endpoint is kept for out-of-band/system sends
 * (event-architecture-plan.md's B14: "keeps its /send endpoint for direct sends").
 */
export function sendNotification(req: Request, res: Response) {
  const { channel = "email", to, template, payload } = (req.body ?? {}) as SendBody;
  if (!to || !template) {
    return res.status(400).json({
      ok: false,
      error: "to and template are required",
    });
  }
  return res.status(202).json({
    ok: true,
    accepted: true,
    channel,
    to,
    template,
    payload: payload ?? {},
  });
}

/** GET /api/notifications — the current user's notifications, newest first. */
export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (userId === null) {
      return res.status(401).json({ ok: false, error: "unauthenticated" });
    }

    const query = req.query as {
      unread?: boolean;
      limit?: number;
      cursor?: string;
    };
    const page = await listNotifications(userId, {
      unreadOnly: query.unread === true,
      limit: query.limit,
      cursor: query.cursor,
    });

    return res.status(200).json({ ok: true, data: page });
  } catch (error) {
    return next(error);
  }
}

/** POST /api/notifications/:id/read — mark one notification read. */
export async function readNotification(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (userId === null) {
      return res.status(401).json({ ok: false, error: "unauthenticated" });
    }

    const { found, unreadCount } = await markNotificationRead(
      userId,
      String(req.params.id ?? "")
    );
    if (!found) {
      return res.status(404).json({ ok: false, error: "notification_not_found" });
    }

    return res.status(200).json({ ok: true, data: { unreadCount } });
  } catch (error) {
    return next(error);
  }
}

/** POST /api/notifications/read-all — mark every unread notification read. */
export async function readAllNotifications(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (userId === null) {
      return res.status(401).json({ ok: false, error: "unauthenticated" });
    }

    const unreadCount = await markAllNotificationsRead(userId);
    return res.status(200).json({ ok: true, data: { unreadCount } });
  } catch (error) {
    return next(error);
  }
}

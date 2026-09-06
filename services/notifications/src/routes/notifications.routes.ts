import express from "express";
import { validateRequest } from "@repo/service-kit";
import {
  getNotifications,
  readAllNotifications,
  readNotification,
  sendNotification,
} from "../controllers/notifications.controller.js";
import {
  listNotificationsSchema,
  notificationIdParamsSchema,
} from "../notifications.validation.js";

const router = express.Router();

router.get("/", validateRequest(listNotificationsSchema), getNotifications);
router.post("/read-all", readAllNotifications);
router.post(
  "/:id/read",
  validateRequest(notificationIdParamsSchema),
  readNotification
);
router.post("/send", sendNotification);

export default router;

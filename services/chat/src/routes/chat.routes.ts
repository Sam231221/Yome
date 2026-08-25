import { Router } from "express";
import { validateRequest } from "@repo/shared";
import {
  getMessages,
  getInitialUsersWithMessages,
  getInitialGroupsWithMessages,
  addMessage,
  addMediaMessage,
} from "../controllers/message.controller.js";
import {
  addMediaMessageSchema,
  addMessageSchema,
  getMessagesSchema,
  groupMessagesSchema,
  initialContactsSchema,
} from "./chat.validation.js";

const router = Router();

router.get("/get-messages/:from/:to/:chatType", validateRequest(getMessagesSchema), getMessages);
router.post("/add-message", validateRequest(addMessageSchema), addMessage);
router.post("/add-media-message", validateRequest(addMediaMessageSchema), addMediaMessage);
router.get(
  "/get-initial-group-messages/:group_id",
  validateRequest(groupMessagesSchema),
  getInitialGroupsWithMessages
);
router.get(
  "/get-initial-contacts/:from",
  validateRequest(initialContactsSchema),
  getInitialUsersWithMessages
);

export default router;

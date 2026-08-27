import { Router } from "express";
import { validateRequest } from "@repo/shared";
import {
  getMessages,
  getInitialUsersWithMessages,
  getInitialGroupsWithMessages,
  addMessage,
  addMediaMessage,
  getOrCreateConversation,
} from "../controllers/message.controller.js";
import {
  addMediaMessageSchema,
  addMessageSchema,
  directConversationSchema,
  getMessagesSchema,
  initialGroupMessagesSchema,
  initialContactsSchema,
} from "./chat.validation.js";

const router = Router();

router.get("/get-messages/:from/:to/:chatType", validateRequest(getMessagesSchema), getMessages);
router.post(
  "/get-or-create-direct-conversation",
  validateRequest(directConversationSchema),
  getOrCreateConversation
);
router.post("/add-message", validateRequest(addMessageSchema), addMessage);
router.post("/add-media-message", validateRequest(addMediaMessageSchema), addMediaMessage);
router.get(
  "/get-initial-group-messages/:userId",
  validateRequest(initialGroupMessagesSchema),
  getInitialGroupsWithMessages
);
router.get(
  "/get-initial-contacts/:from",
  validateRequest(initialContactsSchema),
  getInitialUsersWithMessages
);

export default router;

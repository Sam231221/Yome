import { Router } from "express";
import { validateRequest } from "@repo/shared";
import {
  getMessages,
  getInitialUsersWithMessages,
  getInitialGroupsWithMessages,
  addMessage,
  addMediaMessage,
  getOrCreateConversation,
  prepareDirectCallConversation,
  validateDirectConversation,
} from "../controllers/message.controller.js";
import {
  addMediaMessageSchema,
  addMessageSchema,
  directConversationSchema,
  getMessagesSchema,
  initialGroupMessagesSchema,
  initialContactsSchema,
  prepareDirectCallConversationSchema,
  validateDirectConversationSchema,
} from "./chat.validation.js";

const router = Router();

router.get("/get-messages/:from/:to/:chatType", validateRequest(getMessagesSchema), getMessages);
router.post(
  "/get-or-create-direct-conversation",
  validateRequest(directConversationSchema),
  getOrCreateConversation
);
router.post(
  "/validate-direct-conversation",
  validateRequest(validateDirectConversationSchema),
  validateDirectConversation
);
router.post(
  "/prepare-direct-call-conversation",
  validateRequest(prepareDirectCallConversationSchema),
  prepareDirectCallConversation
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

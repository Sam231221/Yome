import { Router } from "express";
import { validateRequest } from "@repo/shared";
import {
  createCallParticipants,
  createCallToken,
  prepareDirectCallConversation,
  validateDirectConversation,
} from "./calls.controller.js";
import {
  callParticipantsSchema,
  prepareDirectCallConversationSchema,
  validateDirectConversationSchema,
} from "./calls.validation.js";

const router = Router();

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
router.post("/call-token", createCallToken);
router.post(
  "/call-participants",
  validateRequest(callParticipantsSchema),
  createCallParticipants
);

export default router;

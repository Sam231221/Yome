import { Router } from "express";
import {
  getMessages,
  getInitialUsersWithMessages,
  getInitialGroupsWithMessages,
  addMessage,
  addMediaMessage,
} from "../controllers/message.controller.js";

const router = Router();

router.get("/get-messages/:from/:to/:chatType", getMessages);
router.post("/add-message", addMessage);
router.post("/add-media-message", addMediaMessage);
router.get("/get-initial-group-messages/:group_id", getInitialGroupsWithMessages);
router.get("/get-initial-contacts/:from", getInitialUsersWithMessages);

export default router;

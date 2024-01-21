import { Router } from "express";
import {
  addGroupAudioMessage,
  addGroupImageMessage,
  addGroupMessage,
  getGroupMessages,
  getInitialGroupsWithMessages,
} from "../controllers/GroupMessageController.js";
import multer from "multer";

const upload = multer({ dest: "uploads/recordings/" });
const uploadImage = multer({ dest: "uploads/images/" });

const router = Router();

router.post("/add-message", addGroupMessage);
router.get(
  "/get-initial-group-messages/:group_id",
  getInitialGroupsWithMessages
);

router.post("/add-audio-message", upload.single("audio"), addGroupAudioMessage);
router.post(
  "/add-image-message",
  uploadImage.single("image"),
  addGroupImageMessage
);

export default router;

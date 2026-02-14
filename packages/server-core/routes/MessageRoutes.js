import { Router } from "express";
import multer from "multer";
import {
  addAudioMessage,
  addImageMessage,
  addMessage,
  getInitialUsersWithMessages,
  getInitialGroupsWithMessages,
  getMessages,
} from "../controllers/MessageController.js";

const router = Router();

const storage = multer.memoryStorage();
const uploadAudio = multer({ storage: storage });
const uploadImage = multer({ storage: storage });

//both user and group messages
router.get("/get-messages/:from/:to/:chatType", getMessages);

router.post("/add-message", addMessage);
router.get(
  "/get-initial-group-messages/:group_id",
  getInitialGroupsWithMessages
);

router.get("/get-initial-contacts/:from", getInitialUsersWithMessages);
router.post("/add-audio-message", uploadAudio.single("audio"), addAudioMessage);
router.post("/add-image-message", uploadImage.single("image"), addImageMessage);

export default router;

import { Router } from "express";
import multer from "multer";
import {
  addAudioMessage,
  addImageMessage,
  addMessage,
  getInitialContactsWithMessages,
  getMessages,
} from "../controllers/MessageController.js";

const router = Router();

const storage = multer.memoryStorage();
const uploadAudio = multer({ storage: storage });
const uploadImage = multer({ storage: storage });

router.post("/add-message", addMessage);
router.get("/get-messages/:from/:to/:chatType", getMessages);
router.get("/get-initial-contacts/:from", getInitialContactsWithMessages);

router.post("/add-audio-message", uploadAudio.single("audio"), addAudioMessage);
router.post("/add-image-message", uploadImage.single("image"), addImageMessage);

export default router;

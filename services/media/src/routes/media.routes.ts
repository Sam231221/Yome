import { Router } from "express";
import multer from "multer";
import { addAudioMessage, addImageMessage } from "../controllers/media.controller.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = Router();

router.post("/add-audio-message", upload.single("audio"), addAudioMessage);
router.post("/add-image-message", upload.single("image"), addImageMessage);

export default router;

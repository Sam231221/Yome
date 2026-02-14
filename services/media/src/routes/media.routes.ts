import { Router } from "express";
import multer from "multer";
import { uploadAudio, uploadImage } from "../controllers/media.controller.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = Router();

router.post("/add-audio-message", upload.single("audio"), uploadAudio);
router.post("/add-image-message", upload.single("image"), uploadImage);

export default router;

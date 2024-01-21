import { Router } from "express";
import {
  createEducationalInstitutions,
  getAllEducationalInstitutions,
} from "../controllers/EIController.js";
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = Router();

router.get("/get-all-educational-institutions", getAllEducationalInstitutions);
router.post(
  "/create-educational-institution",
  upload.single("thumbnail"),
  createEducationalInstitutions
);

export default router;

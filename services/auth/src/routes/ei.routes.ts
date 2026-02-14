import { Router } from "express";
import multer from "multer";
import {
  getAllEducationalInstitutions,
  createEducationalInstitutions,
} from "../controllers/ei.controller.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get("/get-all-educational-institutions", getAllEducationalInstitutions);
router.post(
  "/create-educational-institution",
  upload.single("file"),
  createEducationalInstitutions
);

export default router;

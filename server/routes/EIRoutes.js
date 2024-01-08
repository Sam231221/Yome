import { Router } from "express";
import { getAllEducationalInstitutions } from "../controllers/EIController.js";

const router = Router();

router.get("/getAll", getAllEducationalInstitutions);

export default router;

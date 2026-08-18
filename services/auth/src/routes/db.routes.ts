import { Router } from "express";
import {
  createMultipleUsersWithProfiles,
  createEducationGroups,
  deleteAllRecords,
} from "../controllers/seed.controller.js";

const router = Router();

router.post("/create-multiple-users", createMultipleUsersWithProfiles);
router.post("/create-multiple-groups", createEducationGroups);
router.post("/deleteAll", deleteAllRecords);

export default router;

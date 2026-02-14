import { Router } from "express";
import {
  createMultipleUsersWithProfiles,
  createEducationGroups,
  deleteAllRecords,
} from "../controllers/DbController.js";

const router = Router();

router.get("/create-multiple-users", createMultipleUsersWithProfiles);
router.get("/create-multiple-groups", createEducationGroups);
router.get("/deleteAll", deleteAllRecords);

export default router;

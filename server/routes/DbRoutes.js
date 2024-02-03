import { Router } from "express";
import {
  createMultipleUsersWithProfiles,
  createEducationGroups,
  createEducationalInstitutions,
  deleteAllRecords,
  createEducationalUtils,
} from "../controllers/DbController.js";

const router = Router();

router.get("/create-multiple-users", createMultipleUsersWithProfiles);
router.get("/create-multiple-groups", createEducationGroups);
router.get("/create-multiple-eis", createEducationalInstitutions);
router.get("/create-multiple-ei-utils", createEducationalUtils);
router.get("/deleteAll", deleteAllRecords);

export default router;

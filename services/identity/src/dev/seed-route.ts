import { Router } from "express";
import {
  createDashboardDemoData,
  createEducationGroups,
  createLearningResources,
  createMultipleUsersWithProfiles,
  deleteAllRecords,
  devSeedGuard,
} from "@repo/seed";

// Dev-only database seed/reset endpoints. Guarded once here rather than per-handler; see
// @repo/seed's devSeedGuard for the enable/disable rule. External paths are unchanged.
const router = Router();
router.use(devSeedGuard);

router.post("/create-multiple-users", createMultipleUsersWithProfiles);
router.post("/create-multiple-groups", createEducationGroups);
router.post("/create-multiple-resources", createLearningResources);
router.post("/create-dashboard-demo-data", createDashboardDemoData);
router.post("/deleteAll", deleteAllRecords);

export default router;

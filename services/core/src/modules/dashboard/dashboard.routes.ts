import { Router } from "express";
import { validateRequest } from "@repo/shared";
import { getDashboardHome } from "./dashboard.controller.js";
import { dashboardParamsSchema } from "./dashboard.validation.js";

const router = Router();

// Moved from services/user in B08 — the last route to leave that service, which is
// deleted in this same batch.
router.get(
  "/dashboard/:loggedInUserId",
  validateRequest(dashboardParamsSchema),
  getDashboardHome
);

export default router;

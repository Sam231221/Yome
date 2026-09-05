import { Router } from "express";
import { validateRequest } from "@repo/shared";
import { getDashboardHome } from "../controllers/user.controller.js";
import { dashboardParamsSchema } from "./user.validation.js";

const router = Router();

// Profile endpoints (get-user-by-id, update-user, get-all-users) moved to
// services/identity in B05. Community endpoints (groups, connections, invitations)
// moved to services/core in B06. Learning reads (events, projects) moved to
// services/core in B07 — see its learning.routes.ts. Only dashboard aggregation
// remains here, pending B08.
router.get(
  "/dashboard/:loggedInUserId",
  validateRequest(dashboardParamsSchema),
  getDashboardHome
);

export default router;

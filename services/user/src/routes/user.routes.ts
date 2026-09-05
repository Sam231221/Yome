import { Router } from "express";
import { validateRequest } from "@repo/shared";
import {
  getDashboardHome,
  getLearningEvents,
  getLearningProjectById,
  getLearningProjects,
} from "../controllers/user.controller.js";
import {
  dashboardParamsSchema,
  projectIdParamsSchema,
} from "./user.validation.js";

const router = Router();

// Profile endpoints (get-user-by-id, update-user, get-all-users) moved to
// services/identity in B05. Community endpoints (groups, connections, invitations)
// moved to services/core in B06 — see its community.routes.ts. Only the learning
// reads and dashboard aggregation remain here, pending B07/B08.
router.get("/events", getLearningEvents);
router.get("/projects", getLearningProjects);
router.get(
  "/projects/:id",
  validateRequest(projectIdParamsSchema),
  getLearningProjectById
);
router.get(
  "/dashboard/:loggedInUserId",
  validateRequest(dashboardParamsSchema),
  getDashboardHome
);

export default router;

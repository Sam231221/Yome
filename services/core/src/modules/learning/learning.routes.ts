import { Router } from "express";
import { validateRequest } from "@repo/shared";
import {
  getLearningEvents,
  getLearningProjectById,
  getLearningProjects,
} from "./learning.controller.js";
import { projectIdParamsSchema } from "./learning.validation.js";

const router = Router();

// Moved from services/user in B07. Dashboard aggregation (/dashboard/:id) stays in
// services/user pending B08 — see routeRules.ts for how the gateway splits /api/user
// across identity, this service (core), and user.
router.get("/events", getLearningEvents);
router.get("/projects", getLearningProjects);
router.get(
  "/projects/:id",
  validateRequest(projectIdParamsSchema),
  getLearningProjectById
);

export default router;

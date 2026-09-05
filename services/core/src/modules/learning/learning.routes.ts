import { Router } from "express";
import { validateRequest } from "@repo/service-kit";
import {
  getLearningEvents,
  getLearningProjectById,
  getLearningProjects,
} from "./learning.controller.js";
import { projectIdParamsSchema } from "./learning.validation.js";

const router = Router();

// Moved from services/user in B07. Dashboard aggregation (/dashboard/:id) moved here
// too in B08 — see dashboard.routes.ts, mounted alongside this router in index.ts —
// once services/user (which owned it until then) was retired.
router.get("/events", getLearningEvents);
router.get("/projects", getLearningProjects);
router.get(
  "/projects/:id",
  validateRequest(projectIdParamsSchema),
  getLearningProjectById
);

export default router;

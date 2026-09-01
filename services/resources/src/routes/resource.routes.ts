import { Router } from "express";
import { validateRequest } from "@repo/shared";
import {
  createResource,
  deleteResourceSave,
  getResourceById,
  getResources,
  markResourceHelpful,
  saveResource,
} from "../controllers/resource.controller.js";
import {
  createResourceSchema,
  listResourcesSchema,
  resourceIdParamsSchema,
} from "./resource.validation.js";

const router = Router();

router.get("/", validateRequest(listResourcesSchema), getResources);
router.get("/:id", validateRequest(resourceIdParamsSchema), getResourceById);
router.post("/", validateRequest(createResourceSchema), createResource);
router.post("/:id/save", validateRequest(resourceIdParamsSchema), saveResource);
router.delete("/:id/save", validateRequest(resourceIdParamsSchema), deleteResourceSave);
router.post("/:id/helpful", validateRequest(resourceIdParamsSchema), markResourceHelpful);

export default router;

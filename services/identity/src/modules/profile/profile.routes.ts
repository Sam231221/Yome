import { Router } from "express";
import multer from "multer";
import {
  createHttpError,
} from "@repo/contracts";
import {
  validateRequest,
} from "@repo/service-kit";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  isAllowedMimeType,
} from "@repo/storage";
import { getAllUsers, getUserById, updateUser } from "./profile.controller.js";
import { getUserByIdSchema, updateUserSchema } from "./profile.validation.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedMimeType(ALLOWED_IMAGE_MIME_TYPES, file.mimetype)) {
      callback(createHttpError("Unsupported avatar image type.", 400));
      return;
    }
    callback(null, true);
  },
});
const router = Router();

// Mounted at /api/user in index.ts — same external prefix apps/web already calls.
// Everything else under /api/user is served by services/core.
router.post("/get-user-by-id", validateRequest(getUserByIdSchema), getUserById);
router.post(
  "/update-user",
  upload.single("avatar"),
  validateRequest(updateUserSchema),
  updateUser,
);
router.get("/get-all-users", getAllUsers);

export default router;

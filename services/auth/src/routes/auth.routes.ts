import { Router } from "express";
import { validateRequest } from "@repo/shared";
import {
  getUserByEmail,
  verifyCredentials,
  registerUser,
  upsertOAuthUser,
  changePassword,
} from "../controllers/auth.controller.js";
import {
  changePasswordSchema,
  getUserByEmailSchema,
  registerUserSchema,
  upsertOAuthUserSchema,
  verifyCredentialsSchema,
} from "./auth.validation.js";

const router = Router();

router.post("/get-user", validateRequest(getUserByEmailSchema), getUserByEmail);
router.post(
  "/verify-credentials",
  validateRequest(verifyCredentialsSchema),
  verifyCredentials
);
router.post("/register-user", validateRequest(registerUserSchema), registerUser);
router.post("/oauth-user", validateRequest(upsertOAuthUserSchema), upsertOAuthUser);
router.post("/change-password", validateRequest(changePasswordSchema), changePassword);

export default router;

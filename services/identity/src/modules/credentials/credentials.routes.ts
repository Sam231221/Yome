import { Router } from "express";
import { validateRequest } from "@repo/service-kit";
import {
  getUserByEmail,
  verifyCredentials,
  registerUser,
  upsertOAuthUser,
  changePassword,
} from "./credentials.controller.js";
import {
  changePasswordSchema,
  getUserByEmailSchema,
  registerUserSchema,
  upsertOAuthUserSchema,
  verifyCredentialsSchema,
} from "./credentials.validation.js";

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

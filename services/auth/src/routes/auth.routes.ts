import { Router } from "express";
import {
  getUserByEmail,
  verifyCredentials,
  registerUser,
  upsertOAuthUser,
  changePassword,
  generateToken,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/get-user", getUserByEmail);
router.post("/verify-credentials", verifyCredentials);
router.post("/register-user", registerUser);
router.post("/oauth-user", upsertOAuthUser);
router.post("/change-password", changePassword);
router.get("/generate-token/:userId", generateToken);

export default router;

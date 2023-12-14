import { Router } from "express";
import {
  getUserByEmail,
  generateToken,
  getAllUsers,
  onBoardUser,
} from "../controllers/AuthController.js";

const router = Router();

router.post("/get-user", getUserByEmail);
router.post("/onBoardUser", onBoardUser);
router.get("/get-contacts", getAllUsers);
router.get("/generate-token/:userId", generateToken);

export default router;

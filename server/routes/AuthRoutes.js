import { Router } from "express";
import {
  getUserByEmail,
  generateToken,
  getAllUsers,
  getAllGroups,
  onBoardUser,
} from "../controllers/AuthController.js";

const router = Router();

router.post("/get-user", getUserByEmail);
router.post("/onBoardUser", onBoardUser);
router.get("/get-users", getAllUsers);
router.get("/get-groups", getAllGroups);
router.get("/generate-token/:userId", generateToken);

export default router;

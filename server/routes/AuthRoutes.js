import { Router } from "express";
import {
  getUserByEmail,
  generateToken,
  getAllUsers,
  getAllGroups,
  onBoardUser,
  getAllGroupsForUser,
  getFollowedUsersByUser,
  getUnfollowedMentors,
  getUnassociatedGroupsForUser,
  followUnfollowedUser,
  joinUnjoinedGroups,
} from "../controllers/AuthController.js";

const router = Router();

router.post("/get-user", getUserByEmail);
router.post("/onBoardUser", onBoardUser);
router.get("/get-all-users", getAllUsers);
router.get("/get-all-groups", getAllGroups);
router.post("/connect-user-to-mentor", followUnfollowedUser);
router.post("/connect-user-to-group", joinUnjoinedGroups);
router.get("/get-connected-groups/:loggedInUserId", getAllGroupsForUser);
router.get("/get-connected-users/:loggedInUserId", getFollowedUsersByUser);
router.get("/get-unfollowed-mentors/:loggedInUserId", getUnfollowedMentors);
router.get(
  "/get-unassociated-groups/:loggedInUserId",
  getUnassociatedGroupsForUser
);
router.get("/generate-token/:userId", generateToken);

export default router;

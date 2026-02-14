import { Router } from "express";
import multer from "multer";
import {
  getUserById,
  updateUser,
  getAllUsers,
  getAllGroups,
  getFollowedUsersByUser,
  getUnfollowedMentors,
  getUnassociatedGroupsForUser,
  getAllGroupsForUser,
  followUnfollowedUser,
  joinUnjoinedGroups,
} from "../controllers/user.controller.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = Router();

router.post("/get-user-by-id", getUserById);
router.post("/update-user", upload.single("avatar"), updateUser);
router.get("/get-all-users", getAllUsers);

router.get("/get-all-groups", getAllGroups);
router.post("/connect-user-to-mentor", followUnfollowedUser);
router.post("/connect-user-to-group", joinUnjoinedGroups);
router.get("/get-connected-groups/:loggedInUserId", getAllGroupsForUser);
router.get("/get-connected-users/:loggedInUserId", getFollowedUsersByUser);
router.get("/get-unfollowed-mentors/:loggedInUserId", getUnfollowedMentors);
router.get("/get-unassociated-groups/:loggedInUserId", getUnassociatedGroupsForUser);

export default router;

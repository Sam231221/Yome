import { Router } from "express";
import multer from "multer";
import { validateRequest } from "@repo/shared";
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
import {
  followUnfollowedUserSchema,
  getUserByIdSchema,
  joinUnjoinedGroupsSchema,
  loggedInUserIdParamsSchema,
  updateUserSchema,
} from "./user.validation.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = Router();

router.post("/get-user-by-id", validateRequest(getUserByIdSchema), getUserById);
router.post(
  "/update-user",
  upload.single("avatar"),
  validateRequest(updateUserSchema),
  updateUser
);
router.get("/get-all-users", getAllUsers);

router.get("/get-all-groups", getAllGroups);
router.post(
  "/connect-user-to-mentor",
  validateRequest(followUnfollowedUserSchema),
  followUnfollowedUser
);
router.post(
  "/connect-user-to-group",
  validateRequest(joinUnjoinedGroupsSchema),
  joinUnjoinedGroups
);
router.get(
  "/get-connected-groups/:loggedInUserId",
  validateRequest(loggedInUserIdParamsSchema),
  getAllGroupsForUser
);
router.get(
  "/get-connected-users/:loggedInUserId",
  validateRequest(loggedInUserIdParamsSchema),
  getFollowedUsersByUser
);
router.get(
  "/get-unfollowed-mentors/:loggedInUserId",
  validateRequest(loggedInUserIdParamsSchema),
  getUnfollowedMentors
);
router.get(
  "/get-unassociated-groups/:loggedInUserId",
  validateRequest(loggedInUserIdParamsSchema),
  getUnassociatedGroupsForUser
);

export default router;

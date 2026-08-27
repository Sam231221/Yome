import { Router } from "express";
import multer from "multer";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  createHttpError,
  isAllowedMimeType,
  validateRequest,
} from "@repo/shared";
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

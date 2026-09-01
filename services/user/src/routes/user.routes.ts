import { Router } from "express";
import multer from "multer";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  createHttpError,
  isAllowedMimeType,
  validateRequest,
} from "@repo/shared";
import {
  createGroup,
  discoverGroups,
  getDashboardHome,
  getConnectionSummary,
  getConnectionSuggestions,
  getFollowingConnections,
  getGroupDetail,
  getGroupInvitations,
  getUserById,
  updateUser,
  getAllUsers,
  getAllGroups,
  getJoinedGroups,
  getFollowedUsersByUser,
  getUnfollowedMentors,
  getUnassociatedGroupsForUser,
  getAllGroupsForUser,
  followUnfollowedUser,
  joinGroupById,
  joinUnjoinedGroups,
} from "../controllers/user.controller.js";
import {
  createGroupSchema,
  dashboardParamsSchema,
  discoverGroupsSchema,
  followUnfollowedUserSchema,
  groupIdParamsSchema,
  getUserByIdSchema,
  joinGroupByIdSchema,
  joinUnjoinedGroupsSchema,
  joinedGroupsParamsSchema,
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
router.get(
  "/dashboard/:loggedInUserId",
  validateRequest(dashboardParamsSchema),
  getDashboardHome
);

router.get("/groups/discover", validateRequest(discoverGroupsSchema), discoverGroups);
router.get(
  "/groups/joined/:loggedInUserId",
  validateRequest(joinedGroupsParamsSchema),
  getJoinedGroups
);
router.get(
  "/groups/invitations/:loggedInUserId",
  validateRequest(joinedGroupsParamsSchema),
  getGroupInvitations
);
router.get("/groups/:id", validateRequest(groupIdParamsSchema), getGroupDetail);
router.post("/groups", validateRequest(createGroupSchema), createGroup);
router.post("/groups/:id/join", validateRequest(joinGroupByIdSchema), joinGroupById);

router.get(
  "/connections/summary/:loggedInUserId",
  validateRequest(loggedInUserIdParamsSchema),
  getConnectionSummary
);
router.get(
  "/connections/suggestions/:loggedInUserId",
  validateRequest(loggedInUserIdParamsSchema),
  getConnectionSuggestions
);
router.get(
  "/connections/following/:loggedInUserId",
  validateRequest(loggedInUserIdParamsSchema),
  getFollowingConnections
);

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

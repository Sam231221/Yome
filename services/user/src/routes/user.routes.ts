import { Router } from "express";
import { validateRequest } from "@repo/shared";
import {
  createGroup,
  discoverGroups,
  getDashboardHome,
  getConnectionSummary,
  getConnectionSuggestions,
  getFollowingConnections,
  getGroupDetail,
  getGroupInvitations,
  getLearningEvents,
  getLearningProjectById,
  getLearningProjects,
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
  joinGroupByIdSchema,
  joinUnjoinedGroupsSchema,
  joinedGroupsParamsSchema,
  loggedInUserIdParamsSchema,
  projectIdParamsSchema,
} from "./user.validation.js";

const router = Router();

// Profile endpoints (get-user-by-id, update-user, get-all-users) moved to
// services/identity in B05 — see its profile.routes.ts. The gateway routes those
// three /api/user paths to identity; everything below still goes to this service.
router.get("/events", getLearningEvents);
router.get("/projects", getLearningProjects);
router.get(
  "/projects/:id",
  validateRequest(projectIdParamsSchema),
  getLearningProjectById
);
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

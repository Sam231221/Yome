import { Router } from "express";
import { validateRequest } from "@repo/shared";
import {
  createGroup,
  discoverGroups,
  getConnectionSummary,
  getConnectionSuggestions,
  getFollowingConnections,
  getGroupDetail,
  getGroupInvitations,
  getAllGroups,
  getJoinedGroups,
  getFollowedUsersByUser,
  getUnfollowedMentors,
  getUnassociatedGroupsForUser,
  getAllGroupsForUser,
  followUnfollowedUser,
  joinGroupById,
  joinUnjoinedGroups,
} from "./community.controller.js";
import {
  createGroupSchema,
  discoverGroupsSchema,
  followUnfollowedUserSchema,
  groupIdParamsSchema,
  joinGroupByIdSchema,
  joinUnjoinedGroupsSchema,
  joinedGroupsParamsSchema,
  loggedInUserIdParamsSchema,
} from "./community.validation.js";

const router = Router();

// Moved from services/user in B06. Profile endpoints (get-user-by-id, update-user,
// get-all-users) went to services/identity in B05; learning reads (events, projects, B07)
// and dashboard aggregation (B08) followed community here too — services/user, which owned
// all of it originally, no longer exists. See routeRules.ts for how the gateway splits
// /api/user between identity and this service.
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

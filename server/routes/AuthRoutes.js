import { Router } from "express";
import {
  getUserByEmail,
  generateToken,
  getAllUsers,
  getAllGroups,
  getAllGroupsForUser,
  getFollowedUsersByUser,
  getUnfollowedMentors,
  getUnassociatedGroupsForUser,
  followUnfollowedUser,
  joinUnjoinedGroups,
  getUserSubscriptionPlan,
  manageStripeSubscriptionAction,
  updateUserSubscriptionPlanById,
  updateUserSubscriptionPlanBySubscriptionId,
  registerUser,
} from "../controllers/AuthController.js";

const router = Router();

router.post("/get-user", getUserByEmail);
router.post("/get-user-subscription-plan", getUserSubscriptionPlan);
router.post(
  "/manage-stripe-subscription-action",
  manageStripeSubscriptionAction
);
router.post(
  "/update-user-subscription-plan-by-id",
  updateUserSubscriptionPlanById
);
router.post(
  "/update-user-subscription-plan-by-subscriptionid",
  updateUserSubscriptionPlanBySubscriptionId
);

router.post("/register-user", registerUser);
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

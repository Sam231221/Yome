import { Router } from "express";
import multer from "multer";
import {
  getUserByEmail,
  getUserById,
  registerUser,
  updateUser,
  getAllUsers,
  getUserSubscriptionPlan,
  updateUserSubscriptionPlanById,
  updateUserSubscriptionPlanBySubscriptionId,
  manageStripeSubscriptionAction,
  getAllGroups,
  getFollowedUsersByUser,
  getUnfollowedMentors,
  getUnassociatedGroupsForUser,
  getAllGroupsForUser,
  followUnfollowedUser,
  joinUnjoinedGroups,
  generateToken,
} from "../controllers/auth.controller.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = Router();

router.post("/get-user", getUserByEmail);
router.post("/get-user-by-id", getUserById);
router.post("/register-user", registerUser);
router.post("/update-user", upload.single("avatar"), updateUser);
router.get("/get-all-users", getAllUsers);

router.post("/get-user-subscription-plan", getUserSubscriptionPlan);
router.post("/manage-stripe-subscription-action", manageStripeSubscriptionAction);
router.post("/update-user-subscription-plan-by-id", updateUserSubscriptionPlanById);
router.post("/update-user-subscription-plan-by-subscriptionid", updateUserSubscriptionPlanBySubscriptionId);

router.get("/get-all-groups", getAllGroups);
router.post("/connect-user-to-mentor", followUnfollowedUser);
router.post("/connect-user-to-group", joinUnjoinedGroups);
router.get("/get-connected-groups/:loggedInUserId", getAllGroupsForUser);
router.get("/get-connected-users/:loggedInUserId", getFollowedUsersByUser);
router.get("/get-unfollowed-mentors/:loggedInUserId", getUnfollowedMentors);
router.get("/get-unassociated-groups/:loggedInUserId", getUnassociatedGroupsForUser);
router.get("/generate-token/:userId", generateToken);

export default router;

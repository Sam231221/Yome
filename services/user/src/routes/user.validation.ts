import { z } from "zod";
import { slugOrUuidSchema } from "@repo/contracts";

// getUserByIdSchema and updateUserSchema (and the nameSchema/usernameSchema they used)
// moved to services/identity/src/modules/profile/profile.validation.ts in B05.
// Community schemas (loggedInUserIdParamsSchema, groupIdParamsSchema, and everything
// that aliased them) moved to
// services/core/src/modules/community/community.validation.ts in B06 — only the two
// aliases below stay, since getDashboardHome/getLearningProjectById remain in this
// service pending B07/B08.

const userIdParamsSchema = z.object({
  loggedInUserId: z.coerce.string().regex(/^\d+$/, "loggedInUserId must be a positive integer"),
});

export const dashboardParamsSchema = {
  params: userIdParamsSchema,
};

export const projectIdParamsSchema = {
  params: z.object({
    id: slugOrUuidSchema,
  }),
};

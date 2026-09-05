import { z } from "zod";

// getUserByIdSchema and updateUserSchema (and the nameSchema/usernameSchema they used)
// moved to services/identity/src/modules/profile/profile.validation.ts in B05.
// Community schemas moved to services/core/src/modules/community/community.validation.ts
// in B06. projectIdParamsSchema moved to
// services/core/src/modules/learning/learning.validation.ts in B07 — only
// dashboardParamsSchema stays, since getDashboardHome remains in this service pending B08.

const userIdParamsSchema = z.object({
  loggedInUserId: z.coerce.string().regex(/^\d+$/, "loggedInUserId must be a positive integer"),
});

export const dashboardParamsSchema = {
  params: userIdParamsSchema,
};

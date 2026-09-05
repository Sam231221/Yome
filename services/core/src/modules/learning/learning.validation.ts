import { z } from "zod";
import { slugOrUuidSchema } from "@repo/contracts";

// Moved from services/user/src/routes/user.validation.ts in B07 — getLearningProjectById
// (the only route this schema validates) moved here too. dashboardParamsSchema, the other
// schema that file exported, stays in services/user: getDashboardHome remains there
// pending B08.
export const projectIdParamsSchema = {
  params: z.object({
    id: slugOrUuidSchema,
  }),
};

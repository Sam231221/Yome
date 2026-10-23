import { z } from "zod";

// Moved from services/user/src/routes/user.validation.ts in B08 — the last schema left
// in that file, which is deleted in this same batch.
const userIdParamsSchema = z.object({
  loggedInUserId: z.coerce.string().regex(/^\d+$/, "loggedInUserId must be a positive integer"),
});

export const dashboardParamsSchema = {
  params: userIdParamsSchema,
};

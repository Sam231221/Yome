import { z } from "zod";

export const listNotificationsSchema = {
  query: z.object({
    unread: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    limit: z.coerce.number().int().positive().max(50).optional(),
    cursor: z.string().uuid().optional(),
  }),
};

export const notificationIdParamsSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
};

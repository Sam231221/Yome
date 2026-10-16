import { z } from "zod";
import { nameSchema, positiveInt, usernameSchema } from "@repo/contracts";

export const getUserByIdSchema = {
  body: z.object({
    userId: positiveInt,
  }),
};

export const updateUserSchema = {
  query: z.object({
    userId: positiveInt,
  }),
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    username: usernameSchema,
    firstname: nameSchema,
    lastname: nameSchema,
    bio: z.string().trim().max(160).optional().default(""),
    address: z.string().trim().max(255).optional().default(""),
  }),
};

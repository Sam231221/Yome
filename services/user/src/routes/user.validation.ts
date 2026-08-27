import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();
const nonEmptyString = z.string().trim().min(1);
const nameSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[A-Za-z][A-Za-z' -]{1,39}$/, "Name must be 2-40 valid characters.");
const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(24)
  .regex(
    /^[A-Za-z0-9._@-]{3,24}$/,
    "Username must be 3-24 characters and may include letters, numbers, dots, underscores, @, or hyphens."
  );
const userIdParamsSchema = z.object({
  loggedInUserId: z.coerce.string().regex(/^\d+$/, "loggedInUserId must be a positive integer"),
});

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

export const loggedInUserIdParamsSchema = {
  params: userIdParamsSchema,
};

export const followUnfollowedUserSchema = {
  body: z.object({
    loggedInUserId: positiveInt,
    mentorId: positiveInt,
  }),
};

export const joinUnjoinedGroupsSchema = {
  body: z.object({
    loggedInUserId: positiveInt,
    groupIdToJoin: nonEmptyString.max(255),
  }),
};

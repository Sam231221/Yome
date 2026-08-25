import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();
const nonEmptyString = z.string().trim().min(1);
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
    email: z.string().trim().email(),
    username: nonEmptyString.max(50),
    firstname: z.string().trim().max(100).optional().default(""),
    lastname: z.string().trim().max(100).optional().default(""),
    bio: z.string().trim().max(500).optional().default(""),
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

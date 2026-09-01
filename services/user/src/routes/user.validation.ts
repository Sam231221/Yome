import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();
const nonEmptyString = z.string().trim().min(1);
const slugOrUuidSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, "must be an id or slug");
const toneSchema = z.enum(["blue", "teal", "amber", "violet", "neutral"]);
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

export const dashboardParamsSchema = loggedInUserIdParamsSchema;

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

export const discoverGroupsSchema = {
  query: z.object({
    query: z.string().trim().max(160).optional(),
    subject: z.string().trim().max(80).optional(),
    sort: z.enum(["active", "members", "featured", "recent", "name"]).optional(),
  }),
};

export const groupIdParamsSchema = {
  params: z.object({
    id: slugOrUuidSchema,
  }),
};

export const projectIdParamsSchema = groupIdParamsSchema;

export const joinedGroupsParamsSchema = loggedInUserIdParamsSchema;

export const createGroupSchema = {
  body: z.object({
    loggedInUserId: positiveInt,
    name: nonEmptyString.max(80),
    about: z.string().trim().max(500).optional().default(""),
    subject: nonEmptyString.max(80).optional().default("General"),
    category: nonEmptyString.max(80).optional().default("Community"),
    tone: toneSchema.optional().default("blue"),
    symbol: nonEmptyString.max(12).optional().default("Y"),
    privacy: nonEmptyString.max(80).optional().default("Public group"),
    location: nonEmptyString.max(120).optional().default("Global"),
    thumbnail: z.string().trim().max(2048).optional().default(""),
    tags: z.array(nonEmptyString.max(40)).max(8).optional().default([]),
  }),
};

export const joinGroupByIdSchema = {
  params: z.object({
    id: slugOrUuidSchema,
  }),
  body: z.object({
    loggedInUserId: positiveInt,
  }),
};

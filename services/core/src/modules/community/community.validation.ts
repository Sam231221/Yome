import { z } from "zod";
import { positiveInt, slugOrUuidSchema, toneSchema } from "@repo/contracts";

const nonEmptyString = z.string().trim().min(1);
const userIdParamsSchema = z.object({
  loggedInUserId: z.coerce.string().regex(/^\d+$/, "loggedInUserId must be a positive integer"),
});

export const loggedInUserIdParamsSchema = {
  params: userIdParamsSchema,
};

export const joinedGroupsParamsSchema = loggedInUserIdParamsSchema;

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

import { z } from "zod";

const slugOrUuidSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, "must be a resource id or slug");

const textSchema = z.string().trim().min(1).max(160);
const longTextSchema = z.string().trim().min(1).max(2000);
const optionalUrlSchema = z
  .string()
  .trim()
  .url()
  .max(2048)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const resourceToneSchema = z.enum(["violet", "blue", "teal", "amber", "neutral"]);

export const listResourcesSchema = {
  query: z.object({
    search: z.string().trim().max(160).optional(),
    subject: z.string().trim().max(80).optional(),
    type: z.string().trim().max(80).optional(),
    level: z.string().trim().max(80).optional(),
    limit: z.coerce.number().int().positive().max(50).optional(),
    cursor: z.string().trim().min(1).max(160).optional(),
    sort: z.enum(["helpful", "recent", "saved"]).optional(),
  }),
};

export const resourceIdParamsSchema = {
  params: z.object({
    id: slugOrUuidSchema,
  }),
};

export const createResourceSchema = {
  body: z
    .object({
      title: textSchema,
      slug: slugOrUuidSchema.optional(),
      subject: textSchema.max(80),
      topic: textSchema.max(80),
      level: textSchema.max(80),
      type: textSchema.max(40),
      tone: resourceToneSchema.default("blue"),
      description: longTextSchema,
      fileUrl: optionalUrlSchema,
      externalUrl: optionalUrlSchema,
      ratingAverage: z.coerce.number().min(0).max(5).optional(),
      ratingCount: z.coerce.number().int().min(0).optional(),
    })
    .refine((value) => value.fileUrl || value.externalUrl, {
      message: "fileUrl or externalUrl is required",
      path: ["externalUrl"],
    }),
};

import { z } from "zod";

const positiveIntString = z
  .string()
  .trim()
  .regex(/^\d+$/, "must be a positive integer");
const uuidString = z.string().trim().uuid("must be a valid UUID");
const messageSchema = z.string().trim().min(1).max(5000);
const mediaUrlSchema = z.string().trim().min(1).max(2048);
const chatMediaTypeSchema = z.enum(["image", "audio"]);

export const getMessagesSchema = {
  params: z
    .object({
      from: positiveIntString,
      to: z.string().trim().min(1),
      chatType: z.enum(["user", "group"]),
    })
    .superRefine(({ chatType, to }, ctx) => {
      if (chatType === "user" && !/^\d+$/.test(to)) {
        ctx.addIssue({
          code: "custom",
          path: ["to"],
          message: "to must be a positive integer for user chat",
        });
      }
    }),
};

export const addMessageSchema = {
  body: z.discriminatedUnion("chatType", [
    z.object({
      chatType: z.literal("user"),
      from: z.coerce.number().int().positive(),
      to: z.coerce.number().int().positive(),
      message: messageSchema,
    }),
    z.object({
      chatType: z.literal("group"),
      from: z.coerce.number().int().positive(),
      to: uuidString,
      message: messageSchema,
    }),
  ]),
};

export const addMediaMessageSchema = {
  body: z.discriminatedUnion("chatType", [
    z.object({
      chatType: z.literal("user"),
      from: z.coerce.number().int().positive(),
      to: z.coerce.number().int().positive(),
      url: mediaUrlSchema,
      type: chatMediaTypeSchema.optional(),
      conversationId: z.string().trim().min(1).optional(),
    }),
    z.object({
      chatType: z.literal("group"),
      from: z.coerce.number().int().positive(),
      to: uuidString,
      url: mediaUrlSchema,
      type: chatMediaTypeSchema.optional(),
    }),
  ]),
};

export const initialGroupMessagesSchema = {
  params: z.object({
    userId: positiveIntString,
  }),
};

export const legacyInitialGroupMessagesSchema = {
  params: z.object({
    group_id: positiveIntString,
  }),
};

export const initialContactsSchema = {
  params: z.object({
    from: positiveIntString,
  }),
};

export const directConversationSchema = {
  body: z.object({
    from: z.coerce.number().int().positive(),
    to: z.coerce.number().int().positive(),
  }),
};

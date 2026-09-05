import { z } from "zod";

export const validateDirectConversationSchema = {
  body: z.object({
    callerId: z.coerce.number().int().positive(),
    peerId: z.coerce.number().int().positive(),
    conversationId: z.string().trim().min(1),
  }),
};

export const prepareDirectCallConversationSchema = {
  body: z.object({
    callerId: z.coerce.number().int().positive(),
    peerId: z.coerce.number().int().positive(),
  }),
};

const streamSeedUserSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().trim().optional().nullable(),
  image: z.string().trim().optional().nullable(),
});

/** Provisions a direct call's Stream users. Replaces `ensureDirectCallUsers()` in
 * `apps/web/actions/stream.actions.ts` (B09). */
export const callParticipantsSchema = {
  body: z.object({
    callerId: z.coerce.number().int().positive(),
    peerId: z.coerce.number().int().positive(),
    conversationId: z.string().trim().min(1),
    users: z.array(streamSeedUserSchema).min(1),
  }),
};

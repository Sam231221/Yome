import { z } from "zod";

/**
 * Reusable request-validation primitives. Services adopt these incrementally (B05–B09);
 * they are defined here so the definitions stop drifting per service.
 */

/** Coerces a string/number to a positive integer. */
export const positiveInt = z.coerce.number().int().positive();

/** A positive-integer id that arrives as a string (path/query params). */
export const positiveIntString = z
  .string()
  .trim()
  .regex(/^\d+$/, "must be a positive integer");

/** An id or slug: 1–160 chars, alphanumeric start, then alphanumerics / `_` / `-`. */
export const slugOrUuidSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, "must be an id or slug");

/** The shared UI tone vocabulary used by groups, resources, posts, etc. */
export const toneSchema = z.enum([
  "blue",
  "teal",
  "amber",
  "violet",
  "neutral",
]);
export type Tone = z.infer<typeof toneSchema>;

/**
 * A person's display name. Promoted here in B05 — it was byte-identical between
 * `services/auth` and `services/user`, the two services merging into `identity`.
 */
export const nameSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[A-Za-z][A-Za-z' -]{1,39}$/, "Name must be 2-40 valid characters.");

/** A login username. Promoted alongside `nameSchema` for the same reason. */
export const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(24)
  .regex(
    /^[A-Za-z0-9._@-]{3,24}$/,
    "Username must be 3-24 characters and may include letters, numbers, dots, underscores, @, or hyphens.",
  );

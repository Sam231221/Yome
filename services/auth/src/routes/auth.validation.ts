import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);
const emailSchema = z.string().trim().toLowerCase().email();
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
const strongPasswordSchema = z
  .string()
  .min(8)
  .max(64)
  .regex(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/,
    "Password must be 8-64 characters and include at least one letter, one number, and one special character."
  );
const passwordSchema = z.string().min(1);

export const getUserByEmailSchema = {
  body: z.object({
    email: emailSchema,
  }),
};

export const verifyCredentialsSchema = {
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
};

export const registerUserSchema = {
  body: z.object({
    email: emailSchema,
    username: usernameSchema,
    firstname: nameSchema,
    lastname: nameSchema,
    password: strongPasswordSchema,
  }),
};

export const upsertOAuthUserSchema = {
  body: z.object({
    email: emailSchema,
    name: z.string().trim().max(200).optional(),
    image: z.string().trim().max(2048).optional(),
  }),
};

export const changePasswordSchema = {
  body: z
    .object({
      currentPassword: passwordSchema,
      newPassword: strongPasswordSchema,
      confirmPassword: z.string().min(1),
    })
    .refine((value) => value.newPassword === value.confirmPassword, {
      message: "Confirmation must match the new password exactly.",
      path: ["confirmPassword"],
    }),
};

export const generateTokenSchema = {
  params: z.object({
    userId: nonEmptyString.regex(/^\d+$/, "userId must be a positive integer"),
  }),
};

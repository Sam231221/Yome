import { z } from "zod";
import { nameSchema, usernameSchema } from "@repo/shared";
const emailSchema = z.string().trim().toLowerCase().email();
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

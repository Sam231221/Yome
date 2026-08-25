import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);
const emailSchema = z.string().trim().email();
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
    username: nonEmptyString.max(50),
    firstname: z.string().trim().max(100).optional(),
    lastname: z.string().trim().max(100).optional(),
    password: z.string().min(8).max(128),
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
  body: z.object({
    currentPassword: passwordSchema,
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  }),
};

export const generateTokenSchema = {
  params: z.object({
    userId: nonEmptyString.regex(/^\d+$/, "userId must be a positive integer"),
  }),
};

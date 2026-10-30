import { z } from "zod";
import { zxcvbn } from "zxcvbn-ts";
import blocklistJson from "horizon-blocklist";

/**
 * horizon-blocklist has two kinds of lists:
 * - `reserved`: names that may not be used as a whole username (e.g. "admin", "i").
 * - every other key (`en`, `de`, ...): offensive terms that may not appear anywhere in it.
 */
const blocklist = z
  .record(z.string(), z.array(z.string()))
  .parse(blocklistJson);

const { reserved, ...offensiveByLanguage } = blocklist;

const RESERVED_USERNAMES = new Set(reserved.map((term) => term.toLowerCase()));

const OFFENSIVE_TERMS = Object.values(offensiveByLanguage)
  .flat()
  .map((term) => term.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Must be at least 8 characters")
  .max(128, "Must be at most 128 characters")
  .refine((value) => zxcvbn(value).score >= 2, {
    message: "Password is too weak. Avoid common words or patterns.",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Please enter your current password"),
    newPassword: passwordSchema,
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });

// type ChangePasswordData = z.infer<typeof changePasswordSchema>;

const emailSchema = z.email({ error: "Invalid email address" });

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(25, "Username cannot exceed 25 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Only letters, numbers, and underscores are allowed",
  )
  .transform((val) => val.toLowerCase())
  .refine((val) => !RESERVED_USERNAMES.has(val), {
    message: "This username is reserved.",
  })
  .refine((val) => !OFFENSIVE_TERMS.some((term) => val.includes(term)), {
    message: "This username contains prohibited terms.",
  });

export const registerSchema = z
  .object({
    userName: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
  })
  .refine((d) => !d.password.toLowerCase().includes(d.userName.toLowerCase()), {
    message: "Password must not contain your username",
    path: ["password"],
  });

export type RegisterData = z.output<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your username or email"),
  password: z.string().min(1, "Enter your password"),
  rememberMe: z.boolean(),
});

export type LoginData = z.output<typeof loginSchema>;

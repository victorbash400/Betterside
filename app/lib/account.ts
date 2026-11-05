import { z } from "zod";
export const accountSchema = z.object({
  id: z.guid(),
  email: z.email(),
  name: z.string(),
  emailVerified: z.boolean(),
  demo: z.boolean().default(false),
});
export type Account = z.infer<typeof accountSchema>;
export type AuthStep =
  "sign-in" | "sign-up" | "confirm" | "reset" | "reset-confirm";
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(254));
export const passwordSchema = z.string().min(1).max(256);
export const newPasswordSchema = passwordSchema
  .min(12)
  .refine(
    (value) =>
      Array.from(value).some((char) => char >= "a" && char <= "z") &&
      Array.from(value).some((char) => char >= "A" && char <= "Z") &&
      Array.from(value).some((char) => char >= "0" && char <= "9"),
    "Use at least 12 characters, uppercase, lowercase, and a number.",
  );
export const nameSchema = z.string().trim().min(1).max(100);
export const codeSchema = z
  .string()
  .length(6)
  .refine(
    (value) => Array.from(value).every((char) => char >= "0" && char <= "9"),
    "Enter the six-digit code.",
  );

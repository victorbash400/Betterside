import { z } from "zod";
export type SettingsSection = "profile" | "appearance" | "models" | "paypal";
export const settingsConfigurationSchema = z.object({
  models: z.object({
    fast: z.string().nullable(),
    reasoning: z.string().nullable(),
    audio: z.string().nullable(),
  }),
  paypal: z.object({
    sandbox: z.boolean(),
    credentials: z.boolean(),
    webhook: z.boolean(),
  }),
});
export type SettingsConfiguration = z.infer<typeof settingsConfigurationSchema>;

import { subscriptionSchema } from "./paypalSubscription.ts";
import { z } from "zod";
import { contributionGoalSchema, goalCategories } from "./profile.ts";
export const goalsResultSchema = z.object({
  kind: z.literal("goals"),
  revision: z.number().int().nonnegative(),
  timeZone: z.string(),
  asOf: z.iso.datetime(),
  availableCategories: z.array(z.enum(goalCategories)),
  subscriptions: z.array(subscriptionSchema).default([]),
  goals: z.array(contributionGoalSchema.extend({
    contributedCents: z.number().int().nonnegative(),
    percent: z.number().min(0).max(100),
  })),
});
export type GoalsResult = z.infer<typeof goalsResultSchema>;

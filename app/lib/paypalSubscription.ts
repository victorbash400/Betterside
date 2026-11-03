import { z } from "zod";
export const subscriptionStatusSchema = z.enum([
  "APPROVAL_PENDING",
  "APPROVED",
  "ACTIVE",
  "SUSPENDED",
  "CANCELLED",
  "EXPIRED",
]);
export const subscriptionSchema = z.object({
  id: z.string().min(1).max(64),
  goalId: z.string().min(1).max(100),
  projectId: z.string(),
  projectName: z.string(),
  amount: z.string(),
  status: subscriptionStatusSchema,
  nextBillingTime: z.string().nullable(),
  pendingChange: z
    .object({
      amount: z.string(),
      approvalUrl: z
        .url()
        .refine(
          (value) => new URL(value).origin === "https://www.sandbox.paypal.com",
        )
        .nullable(),
    })
    .nullable()
    .optional(),
  approvalUrl: z
    .url()
    .refine(
      (value) => new URL(value).origin === "https://www.sandbox.paypal.com",
    )
    .nullable(),
});
export type GoalSubscription = z.infer<typeof subscriptionSchema>;
export function subscriptionLocked(status: GoalSubscription["status"]) {
  return !["CANCELLED", "EXPIRED"].includes(status);
}

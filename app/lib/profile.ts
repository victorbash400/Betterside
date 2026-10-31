import { z } from "zod";
import { organizationTopics } from "./organizations.ts";
import type { MapItem, Contribution } from "./types.ts";
import { amountInCents } from "./payment.ts";
export const goalCategories = ["All causes", ...organizationTopics] as const;
export const contributionGoalSchema = z.object({
  id: z.string().min(1).max(100),
  category: z.enum(goalCategories),
  targetCents: z.number().int().min(100).max(100000000),
  period: z.enum(["monthly", "once"]),
  createdAt: z.iso.datetime(),
});
export const profileSchema = z.object({
  name: z.string().trim().max(100).default(""),
  timeZone: z
    .string()
    .max(100)
    .refine((zone) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: zone });
        return true;
      } catch {
        return false;
      }
    })
    .default("Africa/Nairobi"),
  goals: z
    .array(contributionGoalSchema)
    .max(30)
    .refine(
      (goals) => new Set(goals.map((goal) => goal.id)).size === goals.length,
      "Duplicate goals.",
    ),
});
export const profileResponseSchema = z.object({
  profile: profileSchema,
  revision: z.number().int().nonnegative(),
});
export type DonorProfile = z.infer<typeof profileSchema>;
export type ContributionGoal = z.infer<typeof contributionGoalSchema>;
export const emptyProfile: DonorProfile = {
  name: "",
  timeZone: "Africa/Nairobi",
  goals: [],
};
const topicKinds: Record<string, string[]> = {
  "Conflict response": ["Conflict"],
  Refugees: ["Displacement"],
  Shelter: ["Displacement"],
  "Camp management": ["Displacement"],
};
export function goalMatchesProject(goal: ContributionGoal, record: MapItem) {
  return (
    Boolean(record.project) &&
    (goal.category === "All causes" ||
      record.kind === goal.category ||
      topicKinds[goal.category]?.includes(record.kind) === true)
  );
}
function month(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  return parts
    .filter((part) => part.type === "year" || part.type === "month")
    .map((part) => part.value)
    .join(":");
}
export function goalProgress(
  goal: ContributionGoal,
  contributions: Contribution[],
  timeZone: string,
  now = new Date(),
) {
  const seen = new Set<string>();
  let cents = 0;
  for (const payment of contributions) {
    if (
      (payment.status !== "COMPLETED" && payment.status !== "REFUNDED") ||
      payment.goalId !== goal.id ||
      seen.has(payment.id)
    )
      continue;
    const completed = new Date(payment.completedAt ?? payment.createdAt);
    if (
      !Number.isFinite(completed.getTime()) ||
      completed > now ||
      completed < new Date(goal.createdAt)
    )
      continue;
    if (
      goal.period === "monthly" &&
      month(completed, timeZone) !== month(now, timeZone)
    )
      continue;
    seen.add(payment.id);
    const paid = amountInCents(payment.amount);
    const refunded =
      payment.refundedCents ?? (payment.status === "REFUNDED" ? paid : 0);
    if (!Number.isSafeInteger(refunded) || refunded < 0 || refunded > paid)
      throw new Error("Invalid contribution refund amount.");
    cents += paid - refunded;
  }
  return { cents, percent: Math.min(100, (cents / goal.targetCents) * 100) };
}

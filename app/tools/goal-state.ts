import { donorSubscriptions } from "../server/subscriptionStore.ts";
import { subscriptionSchema } from "../lib/paypalSubscription.ts";
import "server-only";
import { loadProfile } from "../server/profile.ts";
import { contributions } from "../server/contributions.ts";
import { goalCategories, goalMatchesProject, goalProgress } from "../lib/profile.ts";
import { goalsResultSchema } from "../lib/chatGoals.ts";
import type { WorkspaceToolContext } from "./context.ts";
export async function goalState({ donor, records }: WorkspaceToolContext, focusedGoalId?: string) {
  const [{ profile, revision }, ledger, subscriptions] = await Promise.all([
    loadProfile(donor),
    contributions(donor),
    donorSubscriptions(donor),
  ]);
  const now = new Date();
  return goalsResultSchema.parse({
    kind: "goals",
    focusedGoalId,
    subscriptions: subscriptions.map((subscription) => subscriptionSchema.parse(subscription)),
    revision,
    timeZone: profile.timeZone,
    asOf: now.toISOString(),
    availableCategories: goalCategories.filter((category) =>
      records.some((record) => goalMatchesProject({ category }, record)),
    ),
    goals: profile.goals.map((goal) => {
      const progress = goalProgress(goal, ledger, profile.timeZone, now);
      return { ...goal, contributedCents: progress.cents, percent: progress.percent };
    }),
  });
}

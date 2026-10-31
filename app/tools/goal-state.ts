import "server-only";
import { loadProfile } from "../server/profile.ts";
import { contributions } from "../server/contributions.ts";
import { goalCategories, goalMatchesProject, goalProgress } from "../lib/profile.ts";
import { goalsResultSchema } from "../lib/chatGoals.ts";
import type { WorkspaceToolContext } from "./context.ts";
export async function goalState({ donor, records }: WorkspaceToolContext) {
  const [{ profile, revision }, ledger] = await Promise.all([
    loadProfile(donor),
    contributions(donor),
  ]);
  const now = new Date();
  return goalsResultSchema.parse({
    kind: "goals",
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

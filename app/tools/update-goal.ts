import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { loadProfile, saveProfile } from "../server/profile.ts";
import { contributionGoalSchema } from "../lib/profile.ts";
import { goalsResultSchema } from "../lib/chatGoals.ts";
import { goalState } from "./goal-state.ts";
import type { WorkspaceToolContext } from "./context.ts";
export function updateGoalTool(context: WorkspaceToolContext) {
  return tool({
    description: "Edit the target and/or period of an existing contribution goal when explicitly requested. Read list_goals first and use its exact goal ID and revision. Preserve fields the user did not ask to change. If the goal is ambiguous, ask which one. Changing its cause requires creating a new goal so past contributions keep their original assignment. This never charges the user or changes payment records.",
    inputSchema: z.object({
      goalId: contributionGoalSchema.shape.id,
      revision: z.number().int().nonnegative(),
      targetCents: contributionGoalSchema.shape.targetCents.optional(),
      period: contributionGoalSchema.shape.period.optional(),
    }),
    outputSchema: goalsResultSchema,
    execute: async ({ goalId, revision, targetCents, period }) => {
      if (targetCents === undefined && period === undefined)
        throw new Error("Choose a goal target or period to update.");
      const current = await loadProfile(context.donor);
      const goal = current.profile.goals.find((goal) => goal.id === goalId);
      if (!goal) throw new Error("Goal unavailable. Read goals again.");
      await saveProfile(context.donor, {
        ...current.profile,
        goals: current.profile.goals.map((item) => item.id !== goalId ? item : {
          ...item,
          targetCents: targetCents ?? item.targetCents,
          period: period ?? item.period,
        }),
      }, revision);
      return goalState(context);
    },
  });
}

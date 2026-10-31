import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { createHash } from "node:crypto";
import { loadProfile, saveProfile } from "../server/profile.ts";
import { contributionGoalSchema } from "../lib/profile.ts";
import { goalsResultSchema } from "../lib/chatGoals.ts";
import { goalState } from "./goal-state.ts";
import type { WorkspaceToolContext } from "./context.ts";
export function createGoalTool(context: WorkspaceToolContext) {
  return tool({
    description: "Save a contribution goal only when requested by the user, then show inline goal cards. Read list_goals first for revision. Require a user-specified USD target and cause; ask for missing values. Monthly is the default unless one-time is requested. targetCents is USD cents, so $100 is 10000. This sets a target, never a recurring charge or payment. Categories without a matching demonstration project can be tracked but cannot be funded through checkout.",
    inputSchema: z.object({
      category: contributionGoalSchema.shape.category,
      targetCents: contributionGoalSchema.shape.targetCents,
      period: contributionGoalSchema.shape.period.default("monthly"),
      revision: z.number().int().nonnegative(),
    }),
    outputSchema: goalsResultSchema,
    execute: async ({ revision, ...input }, { toolCallId }) => {
      const id = createHash("sha256").update(JSON.stringify([context.donor, toolCallId])).digest("hex");
      const current = await loadProfile(context.donor);
      const existing = current.profile.goals.find((goal) => goal.id === id);
      if (existing) {
        if (existing.category !== input.category || existing.targetCents !== input.targetCents || existing.period !== input.period)
          throw new Error("Goal request already applied with different values. Read goals again.");
        return goalState(context);
      }
      await saveProfile(context.donor, {
        ...current.profile,
        goals: [...current.profile.goals, { id, ...input, createdAt: new Date().toISOString() }],
      }, revision);
      return goalState(context);
    },
  });
}

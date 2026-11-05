import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { loadProfile } from "../server/profile.ts";
import { reviseSubscription } from "../server/subscriptions.ts";
import { decimalAmount } from "../lib/payment.ts";
import { goalsResultSchema } from "../lib/chatGoals.ts";
import { goalState } from "./goal-state.ts";
import type { WorkspaceToolContext } from "./context.ts";
export function updateGoalTool(context: WorkspaceToolContext) {
  return tool({
    description:
      "Request a new monthly amount for an approved PayPal subscription only when requested. Read list_goals and use its exact ID and revision. The change requires PayPal reapproval; the goal card exposes approval and retains the existing amount until PayPal confirms the new plan. Never claim the amount changed or charge the user. Recipients require a new subscription.",
    inputSchema: z.object({
      goalId: z.string().min(1),
      revision: z.number().int().nonnegative(),
      targetCents: z.number().int().min(100).max(1000000),
      period: z.literal("monthly").optional(),
    }),
    outputSchema: goalsResultSchema,
    execute: async ({ goalId, revision, targetCents }) => {
      const current = await loadProfile(context.donor);
      if (current.revision !== revision)
        throw new Error("Goals changed. Read list_goals again.");
      await reviseSubscription(
        context.donor,
        goalId,
        decimalAmount(targetCents),
        context.origin,
      );
      return goalState(context, goalId);
    },
  });
}

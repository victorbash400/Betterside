import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { createHash } from "node:crypto";
import { loadProfile } from "../server/profile.ts";
import { setupSubscription } from "../server/subscriptionSetup.ts";
import { contributionGoalSchema } from "../lib/profile.ts";
import { decimalAmount } from "../lib/payment.ts";
import { goalsResultSchema } from "../lib/chatGoals.ts";
import { goalState } from "./goal-state.ts";
import type { WorkspaceToolContext } from "./context.ts";
export function createGoalTool(context: WorkspaceToolContext) {
  return tool({
    description:
      "Prepare a monthly PayPal sandbox subscription only when the user requests it. Search records with projectsOnly first and require an exact supported project, its cause, and a user-specified USD monthly amount. Read list_goals for revision. Returns a goal card with Continue in PayPal; this does not approve or charge the subscription. Never claim it is active before PayPal approval.",
    inputSchema: z.object({
      projectId: z.string().min(1),
      category: contributionGoalSchema.shape.category,
      targetCents: z.number().int().min(100).max(1000000),
      period: z.literal("monthly").default("monthly"),
      revision: z.number().int().nonnegative(),
    }),
    outputSchema: goalsResultSchema,
    execute: async (
      { revision, projectId, category, targetCents },
      { toolCallId },
    ) => {
      const id = createHash("sha256")
        .update(JSON.stringify([context.donor, toolCallId]))
        .digest("hex");
      const current = await loadProfile(context.donor);
      if (
        !current.profile.goals.some((goal) => goal.id === id) &&
        current.revision !== revision
      )
        throw new Error("Goals changed. Read list_goals again.");
      await setupSubscription(
        context.donor,
        { goalId: id, projectId, category, amount: decimalAmount(targetCents) },
        context.origin,
      );
      return goalState(context);
    },
  });
}

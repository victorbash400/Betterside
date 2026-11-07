import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { loadProfile, saveProfile } from "../server/profile.ts";
import { goalSubscription } from "../server/subscriptionStore.ts";
import { manageSubscription, refreshSubscription, syncSubscriptionPayments } from "../server/subscriptions.ts";
import { goalState } from "./goal-state.ts";
import { goalsResultSchema } from "../lib/chatGoals.ts";
import type { WorkspaceToolContext } from "./context.ts";
export const manageGoalInputSchema = z.object({
  goalId: z.string().min(1).max(100),
  revision: z.number().int().nonnegative(),
  action: z.enum(["pause", "resume", "cancel", "refresh", "remove"]),
});
export function manageGoalTool(context: WorkspaceToolContext) {
  return tool({
    description: "Manage an explicitly requested existing goal using exact goal ID and revision from list_goals. Pause/resume/cancel affect its PayPal subscription and require confirmation in chat. Refresh reads current PayPal status and ledger payments without changing billing. Remove deletes an unlocked goal or discards a pending approval; it cannot silently cancel an active subscription. Returns current goal cards and authoritative subscription states.",
    inputSchema: manageGoalInputSchema,
    outputSchema: goalsResultSchema,
    needsApproval: (input) => input.action !== "refresh",
    execute: async ({ goalId, revision, action }) => {
      const current = await loadProfile(context.donor);
      if (current.revision !== revision) throw new Error("Goals changed. Read list_goals again.");
      if (!current.profile.goals.some((goal) => goal.id === goalId)) throw new Error("Goal unavailable. Read list_goals again.");
      if (action === "remove") {
        await saveProfile(context.donor, { ...current.profile, goals: current.profile.goals.filter((goal) => goal.id !== goalId) }, revision);
      } else if (action === "refresh") {
        const stored = await goalSubscription(context.donor, goalId);
        if (!stored) throw new Error("Subscription not found.");
        const updated = await refreshSubscription(stored);
        if (updated.status !== "APPROVAL_PENDING") await syncSubscriptionPayments(updated);
      } else await manageSubscription(context.donor, goalId, action);
      return goalState(context, action === "remove" ? undefined : goalId);
    },
  });
}

import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { goalsResultSchema } from "../lib/chatGoals.ts";
import { goalState } from "./goal-state.ts";
import type { WorkspaceToolContext } from "./context.ts";
export function listGoalsTool(context: WorkspaceToolContext) {
  return tool({
    description: "Read the current user's saved contribution goals and ledger-backed progress, and render live goal cards inline. Call before creating or editing goals to obtain the current revision and exact goal IDs. Amounts are USD cents; monthly progress uses the profile timezone. Pending orders never count. Empty goals means none saved, not all causes selected.",
    inputSchema: z.object({}),
    outputSchema: goalsResultSchema,
    execute: async () => goalState(context),
  });
}

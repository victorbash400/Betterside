import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { payment } from "../server/contributions.ts";
import { contributionsResultSchema } from "../lib/chatWorkspace.ts";
import type { WorkspaceToolContext } from "./context.ts";
export function getContributionTool({ donor }: WorkspaceToolContext) {
  return tool({
    description: "Read an exact contribution receipt from this account, including ledger status, captured amount and recorded refunds. Use an order ID from list_contributions. No provider payment is approved, captured or refunded by this tool.",
    inputSchema: z.object({ orderId: z.string().min(1).max(160) }),
    outputSchema: contributionsResultSchema,
    execute: async ({ orderId }) => {
      const record = await payment(orderId);
      if (!record || record.donor !== donor) throw new Error("Contribution unavailable.");
      return contributionsResultSchema.parse({ kind: "contributions", records: [record], total: 1, nextOffset: null });
    },
  });
}

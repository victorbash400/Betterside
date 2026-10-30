import "server-only";
import { tool } from "ai";
import { chartInputSchema, buildChatChart } from "../lib/chatCharts.ts";
import type { WorkspaceToolContext } from "./context.ts";
export function showSummaryTool(context: WorkspaceToolContext) {
  return tool({
    description:
      "Show inline numeric summary widgets calculated from source records. Use metric records with groupBy country/cause/month, or metric target/raised/funding-gap with groupBy project for demonstration funding. Never supply invented values. Filter to at most 24 groups. Funding amounts are illustrative sandbox data; record counts are not people or unique crises.",
    inputSchema: chartInputSchema.omit({ type: true }),
    execute: async (input) =>
      buildChatChart(context.records, { ...input, type: "summary" }),
  });
}

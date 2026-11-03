import "server-only";
import { tool } from "ai";
import { contributions } from "../server/contributions.ts";
import { contributionChartInputSchema, buildContributionChart } from "../lib/contributionCharts.ts";
import { chartResultSchema } from "../lib/chatCharts.ts";
import type { WorkspaceToolContext } from "./context.ts";
export function showContributionChartTool({ donor }: WorkspaceToolContext) {
  return tool({
    description: "Chart this account's actual sandbox contribution ledger inline. paid is captured COMPLETED amounts minus recorded refunds; pending, failed and cancelled orders do not count as paid. orders counts all order statuses. Monetary time charts use completion timestamps, not order creation; refund charts are grouped by original completion month, not an invented refund date. Filter project, goal or date range to at most 24 groups. Never claim real-world donations from sandbox figures.",
    inputSchema: contributionChartInputSchema,
    outputSchema: chartResultSchema,
    execute: async (input) => buildContributionChart(await contributions(donor), input),
  });
}

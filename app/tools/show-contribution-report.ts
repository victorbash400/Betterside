import "server-only";
import { tool } from "ai";
import { buildContributionReport, contributionReportInputSchema, contributionReportSchema } from "../lib/contributionReport.ts";
import { contributions } from "../server/contributions.ts";
import type { WorkspaceToolContext } from "./context.ts";

export function showContributionReportTool({ donor }: WorkspaceToolContext) {
  return tool({
    description: "Open an inline AG Studio report for this account's captured PayPal sandbox contributions. Includes net paid, refunds and receipts with shared project filters and project/month views. Dates use original capture in UTC, including for refunds. Pending, failed and cancelled orders are excluded. Use for contribution dashboards, reports and completed contributions by project or month.",
    inputSchema: contributionReportInputSchema,
    outputSchema: contributionReportSchema,
    execute: async (input) => buildContributionReport(await contributions(donor), input),
  });
}

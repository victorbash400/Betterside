import { z } from "zod";
import { amountInCents } from "./payment.ts";
import { chartResultSchema, type ChatChart } from "./chatCharts.ts";
import type { Contribution } from "./types.ts";
export const contributionChartInputSchema = z.object({
  type: z.enum(["bar", "column", "line", "area", "pie", "donut", "summary"]),
  metric: z.enum(["paid", "refunded", "orders"]),
  groupBy: z.enum(["month", "project", "status"]),
  goalId: z.string().min(1).max(100).optional(),
  projectId: z.string().min(1).max(160).optional(),
  from: z.iso.date().optional(),
  through: z.iso.date().optional(),
});
export function buildContributionChart(records: Contribution[], raw: z.infer<typeof contributionChartInputSchema>): ChatChart {
  const input = contributionChartInputSchema.parse(raw);
  if (input.from && input.through && input.from > input.through) throw new Error("Choose a valid contribution date range.");
  if ((input.type === "line" || input.type === "area") && input.groupBy !== "month") throw new Error("Time charts require monthly contribution groups.");
  const groups = new Map<string, number>();
  let recordCount = 0, undatedCount = 0;
  for (const record of records) {
    if ((input.goalId && record.goalId !== input.goalId) || (input.projectId && record.projectId !== input.projectId)) continue;
    if (input.metric === "paid" && record.status !== "COMPLETED") continue;
    if (input.metric === "refunded" && (!["COMPLETED", "REFUNDED"].includes(record.status) || !(record.refundedCents || record.status === "REFUNDED"))) continue;
    const date = input.metric === "orders" ? record.createdAt : record.completedAt;
    if (date && ((input.from && date.slice(0, 10) < input.from) || (input.through && date.slice(0, 10) > input.through))) continue;
    if (!date && (input.groupBy === "month" || input.from || input.through)) { undatedCount++; continue; }
    const cents = amountInCents(record.amount);
    const refunded = Math.min(cents, record.refundedCents ?? (record.status === "REFUNDED" ? cents : 0));
    const value = input.metric === "orders" ? 1 : input.metric === "refunded" ? refunded : Math.max(0, cents - refunded);
    const label = input.groupBy === "month" ? date!.slice(0, 7) : input.groupBy === "project" ? record.projectName : record.status;
    groups.set(label, (groups.get(label) ?? 0) + value);
    recordCount++;
  }
  if (!groups.size) throw new Error("No matching contribution data. Adjust the filters.");
  if (groups.size > 24) throw new Error("Select a project, goal or date range with up to 24 groups.");
  return chartResultSchema.parse({
    kind: "chart", type: input.type, title: `${{ paid: "Net completed contributions", refunded: "Recorded refunds", orders: "Sandbox orders" }[input.metric]} by ${input.metric === "refunded" && input.groupBy === "month" ? "original completion month" : input.groupBy}`,
    unit: input.metric === "orders" ? "Orders" : "USD", basis: "contributions",
    data: [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value: input.metric === "orders" ? value : value / 100 })),
    recordCount, undatedCount, sources: [],
  });
}

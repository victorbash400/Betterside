import { z } from "zod";
import { amountInCents } from "./payment.ts";
import type { Contribution } from "./types.ts";

const groupBy = z.enum(["project", "month"]);
const reportLimit = 250;
export const contributionReportInputSchema = z.object({
  groupBy,
  from: z.iso.date().optional(),
  through: z.iso.date().optional(),
});

export const contributionReportSchema = z.object({
  groupBy,
  from: z.iso.date().optional(),
  through: z.iso.date().optional(),
  rows: z.array(z.object({
    order: z.string(),
    project: z.string(),
    date: z.string(),
    month: z.string(),
    netCents: z.number().int().nonnegative(),
    refundCents: z.number().int().nonnegative(),
  })).max(reportLimit),
  undated: z.number().int().nonnegative(),
});

export type ContributionReport = z.infer<typeof contributionReportSchema>;

export function buildContributionReport(
  records: Contribution[],
  { groupBy, from, through }: z.infer<typeof contributionReportInputSchema>,
): ContributionReport {
  if (from && through && from > through)
    throw new Error("Choose a valid contribution date range.");
  const rows: ContributionReport["rows"] = [];
  let undated = 0;
  for (const record of records) {
    if (record.status !== "COMPLETED" && record.status !== "REFUNDED") continue;
    const timestamp = record.completedAt;
    const date = timestamp && Number.isFinite(Date.parse(timestamp))
      ? new Date(timestamp).toISOString().slice(0, 10)
      : "";
    if (!date && (from || through)) {
      undated++;
      continue;
    }
    if ((from && date < from) || (through && date > through)) continue;
    const captured = amountInCents(record.amount);
    const refundCents = record.refundedCents ?? (record.status === "REFUNDED" ? captured : 0);
    if (!Number.isSafeInteger(refundCents) || refundCents < 0 || refundCents > captured)
      throw new Error("Invalid contribution refund amount.");
    rows.push({
      order: record.id,
      project: record.projectName,
      date,
      month: date.slice(0, 7),
      netCents: captured - refundCents,
      refundCents,
    });
    if (rows.length > reportLimit)
      throw new Error("Choose a date range with up to 250 captured contributions.");
  }
  return { groupBy, from, through, rows, undated };
}

import { z } from "zod";
import type { MapItem } from "./types.ts";
export const chartInputSchema = z.object({
  type: z.enum(["bar", "column", "pie", "donut", "line", "area", "histogram", "radar", "radial-bar", "treemap", "waterfall", "scatter", "bubble", "heatmap", "summary"]),
  metric: z.enum(["records", "funding-gap", "raised", "target"]),
  groupBy: z.enum(["country", "cause", "month", "project"]),
  country: z.string().max(120).optional(),
  recordIds: z.array(z.string().max(160)).min(1).max(100).optional(),
});
export const chartResultSchema = z.object({
  kind: z.literal("chart"),
  type: chartInputSchema.shape.type,
  title: z.string(),
  unit: z.enum(["Records", "USD", "Orders"]),
  basis: z.enum(["source-records", "contributions"]).default("source-records"),
  data: z
    .array(z.object({ label: z.string(), value: z.number().nonnegative(), x: z.number().nonnegative().optional(), size: z.number().nonnegative().optional(), category: z.string().optional() }))
    .min(1)
    .max(24),
  recordCount: z.number().int().nonnegative(),
  undatedCount: z.number().int().nonnegative(),
  sources: z.array(z.object({ label: z.string(), url: z.url() })),
});
export type ChatChart = z.infer<typeof chartResultSchema>;
export function buildChatChart(
  records: MapItem[],
  raw: z.infer<typeof chartInputSchema>,
): ChatChart {
  const input = chartInputSchema.parse(raw);
  if (
    (input.type === "line" || input.type === "area") &&
    (input.metric !== "records" || input.groupBy !== "month")
  )
    throw new Error(
      "Line and area charts require record counts by reference month.",
    );
  if (
    input.metric !== "records" &&
    (input.groupBy !== "project" || ["donut", "pie"].includes(input.type))
  )
    throw new Error(
      "Compare demonstration funding by project using bars or summary values.",
    );
  if (["scatter", "bubble"].includes(input.type) && (input.metric === "records" || input.groupBy !== "project"))
    throw new Error("Scatter and bubble charts compare demonstration project funding against targets.");
  if (input.type === "heatmap" && (input.metric !== "records" || !["country", "cause"].includes(input.groupBy)))
    throw new Error("Heatmaps compare source-record counts by country and cause.");
  const ids = input.recordIds ? new Set(input.recordIds) : undefined;
  if (ids && [...ids].some((id) => !records.some((record) => record.id === id)))
    throw new Error("Chart records unavailable. Search records again.");
  const selected = records.filter(
    (record) =>
      (!ids || ids.has(record.id)) &&
      (!input.country ||
        record.country
          .toLocaleLowerCase()
          .includes(input.country.trim().toLocaleLowerCase())) &&
      (input.groupBy !== "project" || record.project),
  );
  const groups = new Map<string, number>();
  const projects = new Set<string>();
  const dimensions = new Map<string, { label?: string; x?: number; size?: number; category?: string }>();
  const sources = new Map<string, { label: string; url: string }>();
  let undatedCount = 0;
  for (const record of selected) {
    if (input.groupBy === "project" && record.project) {
      if (projects.has(record.project.id)) continue;
      projects.add(record.project.id);
    }
    let label =
      input.groupBy === "country"
        ? record.country
        : input.groupBy === "cause"
          ? record.kind
          : input.groupBy === "project"
            ? record.project!.name
            : "";
    if (input.groupBy === "month") {
      const start = record.referencePeriod?.start;
      const date = start ? new Date(start) : undefined;
      if (!date || !Number.isFinite(date.getTime())) {
        undatedCount++;
        continue;
      }
      label = date.toISOString().slice(0, 7);
    }
    if (input.type === "heatmap") {
      label = JSON.stringify([record.country, record.kind]);
      dimensions.set(label, { label: record.country, category: record.kind });
    }
    if (["scatter", "bubble"].includes(input.type) && record.project)
      dimensions.set(label, { x: record.project.target, size: Math.max(0, record.project.target - record.project.raised) });
    const value =
      input.metric === "records"
        ? 1
        : input.metric === "raised"
          ? record.project!.raised
          : input.metric === "target"
            ? record.project!.target
            : Math.max(0, record.project!.target - record.project!.raised);
    groups.set(label, (groups.get(label) ?? 0) + value);
    sources.set(record.source.url, {
      label: record.source.label,
      url: record.source.url,
    });
  }
  if (!groups.size)
    throw new Error("No matching chart data. Adjust the source filters.");
  if (groups.size > 24)
    throw new Error(
      "Chart exceeds 24 groups. Select a country or specific record IDs.",
    );
  const metric = {
    records: "Records",
    "funding-gap": "Demonstration funding gap",
    raised: "Demonstration funding raised",
    target: "Demonstration funding target",
  }[input.metric];
  const group = {
    country: "country",
    cause: "issue category",
    month: "reference start month",
    project: "project",
  }[input.groupBy];
  return chartResultSchema.parse({
    kind: "chart",
    type: input.type,
    title: input.type === "heatmap" ? "Source records by country and cause"
      : ["scatter", "bubble"].includes(input.type) ? `${metric} against demonstration targets`
      : `${metric} by ${group}${input.country?.trim() ? ` · ${input.country.trim()}` : ""}`,
    unit: input.metric === "records" ? "Records" : "USD",
    data: [...groups]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value, ...dimensions.get(label) })),
    recordCount: selected.length,
    undatedCount,
    sources: [...sources.values()],
  });
}

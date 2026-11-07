import { z } from "zod";
import { concerns, matchesConcern } from "./concerns.ts";
import { measurementLabels } from "./measurementLabels.ts";
import { measurementSchema } from "./measurements.ts";
import { datasetIds } from "./dataSources.ts";
import type { HapiDataset } from "./feeds/hapi.ts";
import type { MapItem } from "./types.ts";

const datasetsByConcern: Record<string, HapiDataset[]> = {
  hunger: ["hapi-food"],
  famine: ["hapi-famine"],
  water: ["hapi-needs"],
  health: ["hapi-needs"],
  "womens-rights": ["hapi-needs"],
  needs: ["hapi-needs"],
  shelter: ["hapi-needs"],
  displacement: ["hapi-idps"],
  refugees: ["hapi-refugees"],
  war: ["hapi-conflict"],
  rainfall: ["hapi-rainfall"],
  risk: ["hapi-risk"],
};

export const countryCodeSchema = z
  .string()
  .length(3)
  .refine(
    (code) => [...code].every((letter) => letter >= "A" && letter <= "Z"),
    "Invalid country code.",
  );
export const trendScopeSchema = z.object({
  countries: z.array(countryCodeSchema).min(1).max(4),
  concern: z.enum(concerns.map((item) => item.id)).optional(),
  dataset: z.enum(datasetIds).optional(),
  recordId: z.string().min(1).max(160).optional(),
  seriesLabel: z.string().trim().min(1).max(200).optional(),
}).superRefine((scope, ctx) => {
  if (!scope.concern || !scope.dataset) return;
  const supported = datasetsByConcern[scope.concern] ?? [];
  if (!supported.includes(scope.dataset as HapiDataset)) ctx.addIssue({
    code: "custom", path: ["dataset"],
    message: `Dataset ${scope.dataset} does not provide ${scope.concern} history. ${supported.length ? `Choose ${supported.join(", ")}.` : "No historical dataset supports this concern."}`,
  });
});
export type TrendScope = z.infer<typeof trendScopeSchema>;
const sourceSchema = z.object({
  label: z.string(),
  url: z.url(),
  published: z.string().nullable(),
});
export const trendSeriesSchema = z.object({
  id: z.string(),
  recordId: z.string(),
  label: z.string(),
  country: z.string(),
  countryCode: countryCodeSchema,
  dataset: z.enum(datasetIds),
  metric: measurementSchema.shape.metric,
  unit: z.string(),
  source: z.string(),
  points: z.array(
    z.object({
      date: z.iso.datetime(),
      end: z.string().nullable(),
      value: z.number().finite(),
      source: sourceSchema,
    }),
  ),
});
export type TrendSeries = z.infer<typeof trendSeriesSchema>;
export const trendsResponseSchema = z.object({
  series: z.array(trendSeriesSchema),
  failures: z.array(
    z.object({
      countryCode: z.string(),
      dataset: z.string(),
      error: z.string(),
      retryAt: z.iso.datetime().optional(),
    }),
  ),
  fetchedAt: z.iso.datetime(),
});
export type TrendsResponse = z.infer<typeof trendsResponseSchema>;


export function trendDatasets(scope: TrendScope): HapiDataset[] {
  const datasets = scope.concern
    ? (datasetsByConcern[scope.concern] ?? [])
    : [...new Set(Object.values(datasetsByConcern).flat())];
  return scope.dataset
    ? datasets.filter((id) => id === scope.dataset)
    : datasets;
}

export function buildTrendSeries(
  items: MapItem[],
  concern?: TrendScope["concern"],
): TrendSeries[] {
  const groups = new Map<string, TrendSeries>();
  for (const item of items) {
    if (
      !item.dataset ||
      !item.reportingArea ||
      !item.referencePeriod ||
      (concern && !matchesConcern(item, concern))
    )
      continue;
    const date = new Date(item.referencePeriod.start);
    if (!Number.isFinite(date.getTime())) continue;
    for (const measurement of item.measurements ?? []) {
      if (!Number.isFinite(measurement.value)) continue;
      const id = JSON.stringify([
        item.id,
        measurement.metric,
        item.source.label,
      ]);
      let series = groups.get(id);
      if (!series) {
        series = {
          id,
          recordId: item.id,
          label: item.location,
          country: item.country,
          countryCode: item.reportingArea.countryCode,
          dataset: item.dataset,
          metric: measurement.metric,
          unit: measurementLabels[measurement.metric],
          source: item.source.label,
          points: [],
        };
        groups.set(id, series);
      }
      const point = {
        date: date.toISOString(),
        end: item.referencePeriod.end,
        value: measurement.value,
        source: {
          label: item.source.label,
          url: item.source.url,
          published: item.source.published,
        },
      };
      const index = series.points.findIndex(
        (previous) => previous.date === point.date,
      );
      if (index < 0) series.points.push(point);
      else if (
        (point.source.published ?? "") >
        (series.points[index].source.published ?? "")
      )
        series.points[index] = point;
    }
  }
  return [...groups.values()].map((series) => ({
    ...series,
    points: series.points.toSorted((a, b) => a.date.localeCompare(b.date)),
  }));
}

export function comparableTrendSeries(series: TrendSeries[], metric: string) {
  return series.filter(
    (item) => item.metric === metric && item.points.length > 1,
  );
}

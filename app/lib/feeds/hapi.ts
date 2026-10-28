import { createHash } from "node:crypto";
import { z } from "zod";
import type { MapItem, IssueKind } from "../types.ts";
import type { Measurement } from "../measurements.ts";
import { countryIndex, feedDate, type Country } from "./shared.ts";
export type HapiDataset =
  | "hapi-needs"
  | "hapi-food"
  | "hapi-famine"
  | "hapi-idps"
  | "hapi-refugees"
  | "hapi-conflict"
  | "hapi-rainfall"
  | "hapi-funding"
  | "hapi-risk";
const period = z.object({
  resource_hdx_id: z.string(),
  reference_period_start: feedDate,
  reference_period_end: feedDate.nullable(),
});
const national = period.extend({
  location_code: z.string(),
  location_name: z.string(),
});
const geography = national.extend({
  admin_level: z.number(),
  admin1_code: z.string().nullable(),
  admin1_name: z.string().nullable(),
  admin2_code: z.string().nullable(),
  admin2_name: z.string().nullable(),
});
export const hapiRowSchemas = {
  "hapi-funding": national.extend({
    appeal_code: z.string(),
    appeal_name: z.string(),
    requirements_usd: z.number().nullable(),
    funding_usd: z.number(),
    funding_pct: z.number().nullable(),
  }),
  "hapi-risk": national.extend({
    risk_class: z.string(),
    global_rank: z.number(),
    overall_risk: z.number(),
    meta_missing_indicators_pct: z.number().nullable(),
  }),
  "hapi-needs": geography.extend({
    sector_code: z.string(),
    sector_name: z.string().nullable(),
    category: z.string(),
    population_status: z.string(),
    population: z.number().nonnegative(),
  }),
  "hapi-food": geography.extend({
    ipc_phase: z.string(),
    ipc_type: z.string(),
    population_in_phase: z.number().nonnegative(),
  }),
  "hapi-famine": geography.extend({
    ipc_phase: z.string(),
    ipc_type: z.string(),
    population_in_phase: z.number().nonnegative(),
  }),
  "hapi-idps": geography.extend({
    operation: z.string(),
    assessment_type: z.string(),
    reporting_round: z.number(),
    population: z.number().nonnegative(),
  }),
  "hapi-refugees": period.extend({
    origin_location_code: z.string(),
    origin_location_name: z.string(),
    asylum_location_code: z.string(),
    asylum_location_name: z.string(),
    population_group: z.string(),
    gender: z.string(),
    age_range: z.string(),
    population: z.number().nonnegative(),
  }),
  "hapi-conflict": geography.extend({
    event_type: z.string(),
    events: z.number().nonnegative().nullable(),
    fatalities: z.number().nonnegative().nullable(),
  }),
  "hapi-rainfall": geography.extend({
    aggregation_period: z.string(),
    version: z.string().nullable(),
    rainfall: z.number(),
    rainfall_long_term_average: z.number(),
    rainfall_anomaly_pct: z.number(),
    provider_admin1_code: z.string().nullable(),
    provider_admin2_code: z.string().nullable(),
  }),
};
export const resourceSchema = z.object({
  data: z.array(
    z.object({
      resource_hdx_id: z.string(),
      hdx_link: z.url(),
      dataset_hdx_provider_name: z.string(),
      update_date: feedDate,
    }),
  ),
});
export type HapiResource = z.infer<typeof resourceSchema>["data"][number];
const sectorKinds: Record<string, IssueKind> = {
  WSH: "Water",
  FSC: "Hunger",
  NUT: "Hunger",
  HEA: "Health",
  SHL: "Displacement",
  PRO: "Displacement",
};
const number = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
const labels = {
  "hapi-needs": "Humanitarian needs",
  "hapi-food": "Food insecurity",
  "hapi-famine": "Catastrophic hunger · Phase 5",
  "hapi-idps": "Internal displacement",
  "hapi-refugees": "Refugees",
  "hapi-conflict": "Conflict",
  "hapi-rainfall": "Rainfall",
  "hapi-funding": "Response funding",
  "hapi-risk": "National risk",
};
export function hapiIndicators(
  dataset: HapiDataset,
  raw: unknown,
  countries: Country[],
  resources: HapiResource[],
  reviewed: string,
) {
  const rows = z
    .object({ data: z.array(hapiRowSchemas[dataset]) })
    .parse(raw).data;
  const locations = countryIndex(countries),
    metadata = new Map(
      resources.map((resource) => [resource.resource_hdx_id, resource]),
    );
  const latest = new Map<string, MapItem>();
  let skipped = 0;
  for (const row of rows) {
    const refugee = "asylum_location_code" in row;
    const country = locations.get(
      refugee ? row.asylum_location_code : row.location_code,
    );
    const resource = metadata.get(row.resource_hdx_id);
    if (!country?.centroid || !resource) {
      skipped++;
      continue;
    }
    let kind: IssueKind = "Humanitarian needs",
      category = "humanitarian-needs",
      summary = "",
      dimensions: unknown[] = [],
      detail = "";
    const measurements: Measurement[] = [];
    if ("appeal_code" in row) {
      dimensions = [row.appeal_code];
      detail = row.appeal_name;
      summary = `OCHA FTS reported funding: USD ${number(row.funding_usd)}${row.requirements_usd === null ? "" : `; requirements USD ${number(row.requirements_usd)}`}. Appeal ${row.appeal_code}. Reported external funding; this is not a BetterSide contribution project.`;
    } else if ("risk_class" in row) {
      measurements.push({ metric: "risk", value: row.overall_risk });
      summary = `INFORM national risk ${number(row.overall_risk)}/10; class ${row.risk_class}; global rank ${row.global_rank}${row.meta_missing_indicators_pct === null ? "" : `; missing indicators ${number(row.meta_missing_indicators_pct)}%`}. Annual risk assessment, not a current crisis or severity measurement.`;
    } else if ("sector_code" in row) {
      if (row.category !== "" || row.population_status !== "INN") continue;
      kind = sectorKinds[row.sector_code] ?? "Humanitarian needs";
      category =
        kind === "Water"
          ? "water"
          : kind === "Hunger"
            ? "food-security"
            : kind === "Health"
              ? "health"
              : kind === "Displacement"
                ? "displacement"
                : "humanitarian-needs";
      detail = row.sector_name ?? row.sector_code;
      dimensions = [row.sector_code, row.category, row.population_status];
      measurements.push({ metric: "people-in-need", value: row.population });
      summary = `${number(row.population)} people in need: ${detail}. Sector populations overlap; do not sum them.`;
    } else if ("ipc_phase" in row) {
      const phase = dataset === "hapi-famine" ? "5" : "3+";
      if (row.ipc_phase !== phase || row.ipc_type !== "current") continue;
      kind = "Hunger";
      category = phase === "5" ? "catastrophic-hunger" : "food-security";
      dimensions = [row.ipc_phase, row.ipc_type];
      measurements.push({
        metric: phase === "5" ? "ipc-5" : "ipc-3-plus",
        value: row.population_in_phase,
      });
      summary =
        phase === "5"
          ? `${number(row.population_in_phase)} people in IPC/CH Phase 5 (Catastrophe). Household classification; this does not establish area-level Famine. Current assessment for the stated reference period.`
          : `${number(row.population_in_phase)} people in IPC/CH Phase 3 or above. Current assessment for the stated reference period.`;
    } else if ("assessment_type" in row) {
      kind = "Displacement";
      category = "displaced-families";
      detail = row.operation;
      dimensions = [row.operation, row.assessment_type];
      measurements.push({ metric: "idps", value: row.population });
      summary = `${number(row.population)} internally displaced people. ${row.operation}; assessment ${row.assessment_type}, round ${row.reporting_round}. Assessments may overlap.`;
    } else if ("event_type" in row) {
      if (row.events === null) continue;
      kind = "Conflict";
      category = "conflict";
      detail = row.event_type.split("_").join(" ");
      dimensions = [row.event_type];
      measurements.push({ metric: "conflict-events", value: row.events });
      if (row.fatalities !== null)
        measurements.push({
          metric: "conflict-fatalities",
          value: row.fatalities,
        });
      summary = `${number(row.events)} reported ${detail} events${row.fatalities === null ? "" : `; ${number(row.fatalities)} reported fatalities`}. Monthly aggregate; categories overlap and must not be summed.`;
    } else if ("rainfall" in row) {
      if (row.version !== "final" || row.aggregation_period !== "dekad")
        continue;
      kind = "Climate";
      category = "rainfall";
      dimensions = [
        row.aggregation_period,
        row.version,
        row.provider_admin1_code,
        row.provider_admin2_code,
      ];
      measurements.push({
        metric: "rainfall-departure",
        value: row.rainfall - row.rainfall_long_term_average,
      });
      summary = `${number(row.rainfall)} mm rainfall; long-term average ${number(row.rainfall_long_term_average)} mm; provider rainfall anomaly index ${number(row.rainfall_anomaly_pct)}%. Final dekadal observation. This indicator does not establish drought, flooding or humanitarian impact.`;
    } else if ("population_group" in row) {
      if (
        row.population_group !== "REF" ||
        row.gender !== "all" ||
        row.age_range !== "all"
      )
        continue;
      kind = "Displacement";
      category = "displaced-families";
      detail = `From ${row.origin_location_name}`;
      dimensions = [
        row.origin_location_code,
        row.population_group,
        row.gender,
        row.age_range,
      ];
      measurements.push({ metric: "refugees", value: row.population });
      summary = `${number(row.population)} refugees from ${row.origin_location_name}, hosted in ${country.name}. Reported stock for the reference period, not new arrivals.`;
    }
    const subnational = "admin1_code" in row;
    const area = subnational
      ? [row.admin2_name, row.admin1_name, country.name]
          .filter(Boolean)
          .join(", ")
      : country.name;
    const key = [
      country.iso3,
      ...(subnational ? [row.admin1_code, row.admin2_code] : []),
      ...dimensions,
    ];
    const id = `${dataset}:${createHash("sha256").update(JSON.stringify(key)).digest("hex").slice(0, 24)}`;
    const item: MapItem = {
      id,
      location: `${area} · ${detail || labels[dataset]}`,
      country: country.name,
      coordinates: country.centroid.coordinates,
      kind,
      severity: "Insufficient data",
      summary,
      source: {
        label: `${resource.dataset_hdx_provider_name} · HDX HAPI`,
        url: resource.hdx_link,
        published: resource.update_date,
        reviewed,
      },
      dataset,
      recordType: "Indicator",
      geographicPrecision: "Country centroid",
      categoryIds: [category],
      referencePeriod: {
        start: row.reference_period_start,
        end: row.reference_period_end,
      },
      measurements,
      reportingArea: {
        countryCode: country.iso3!,
        adminLevel: subnational ? row.admin_level : 0,
        admin1Code: subnational ? row.admin1_code : null,
        admin2Code: subnational ? row.admin2_code : null,
      },
      eventType:
        "event_type" in row
          ? row.event_type
          : "assessment_type" in row
            ? row.assessment_type
            : undefined,
    };
    const previous = latest.get(id);
    if (
      !previous ||
      row.reference_period_start > previous.referencePeriod!.start ||
      (row.reference_period_start === previous.referencePeriod!.start &&
        resource.update_date > previous.source.published!)
    )
      latest.set(id, item);
  }
  return { issues: [...latest.values()], skipped };
}

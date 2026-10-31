import { z } from "zod";
import type { MapItem } from "../types.ts";
import { coordinatesSchema, type Country } from "./shared.ts";
const numeric = z
  .string()
  .trim()
  .min(1)
  .transform(Number)
  .pipe(z.number().finite());
const eventSchema = z.object({
  id: z.string().min(1),
  type_of_violence: numeric.pipe(z.number().int().min(1).max(3)),
  conflict_name: z.string(),
  dyad_name: z.string(),
  where_prec: numeric.pipe(z.number().int().min(1).max(7)),
  where_coordinates: z.string(),
  adm_1: z.string(),
  adm_2: z.string(),
  latitude: numeric.pipe(z.number().min(-90).max(90)),
  longitude: numeric.pipe(z.number().min(-180).max(180)),
  country: z.string().min(1),
  date_start: z.string(),
  date_end: z.string(),
  best: numeric.pipe(z.number().int().nonnegative()),
  low: numeric.pipe(z.number().int().nonnegative()),
  high: numeric.pipe(z.number().int().nonnegative()),
});
export const ucdpSnapshotSchema = z.object({
  source: z.url(),
  index: z.url(),
  version: z.string(),
  retrievedAt: z.string(),
  data: z.array(z.unknown()),
});
const aliases: Record<string, string> = {
  "DR Congo (Zaire)": "COD",
  "Myanmar (Burma)": "MMR",
  "Russia (Soviet Union)": "RUS",
  "Yemen (North Yemen)": "YEM",
  Iran: "IRN",
  Syria: "SYR",
  Turkey: "TUR",
  Venezuela: "VEN",
};
const violence = [
  "",
  "State-based violence",
  "Non-state violence",
  "One-sided violence",
];
function date(value: string) {
  return `${z.iso.date().parse(value.split(" ")[0].split("T")[0])}T00:00:00.000Z`;
}
export function ucdpEvents(raw: unknown, countries: Country[]) {
  const feed = ucdpSnapshotSchema.parse(raw);
  const byCode = new Map(
    countries
      .filter((country) => country.iso3 && country.centroid)
      .map((country) => [country.iso3!, country]),
  );
  const byName = new Map(
    countries
      .filter((country) => country.centroid)
      .map((country) => [country.name.toLocaleLowerCase(), country]),
  );
  const issues: MapItem[] = [];
  let skipped = 0;
  let warnings = 0;
  for (const input of feed.data) {
    const parsed = eventSchema.safeParse(input);
    if (!parsed.success) {
      skipped++;
      continue;
    }
    const row = parsed.data;
    try {
      const country =
        byCode.get(aliases[row.country]) ??
        byName.get(row.country.toLocaleLowerCase());
      const located = row.where_prec <= 2;
      if (!located && !country?.centroid) {
        skipped++;
        continue;
      }
      const coordinates = coordinatesSchema.parse(
        located
          ? [row.longitude, row.latitude]
          : country!.centroid!.coordinates,
      );
      const locationLabel =
        row.where_prec === 1
          ? "Reported event locality"
          : row.where_prec === 2
            ? "Within approximately 25 km of reported locality"
            : "Country-centre placeholder · precise event location unavailable";
      const start = date(row.date_start),
        end = date(row.date_end);
      if (Date.parse(end) < Date.parse(start)) {
        skipped++;
        continue;
      }
      const validEstimates =
        row.low <= row.high && row.best >= row.low && row.best <= row.high;
      if (!validEstimates) warnings++;
      issues.push({
        id: `ucdp:${row.id}`,
        country: country?.name ?? row.country,
        location: `${row.where_coordinates || row.adm_2 || row.adm_1 || row.country} · ${violence[row.type_of_violence]}`,
        coordinates,
        kind: "Conflict",
        severity: "Insufficient data",
        dataset: "ucdp",
        recordType: "Observation",
        eventType: "political_violence",
        categoryIds: ["conflict"],
        geographicPrecision: located ? "Event location" : "Country centroid",
        locationPrecision: {
          label: locationLabel,
          ...(row.where_prec === 2 ? { uncertaintyKm: 25 } : {}),
        },
        sourceAlert: `UCDP location precision ${row.where_prec}: ${locationLabel}. Candidate data are preliminary.${validEstimates ? "" : " Source fatality estimates are inconsistent; numerical fatality measures withheld."}`,
        summary: `${violence[row.type_of_violence]}. ${row.conflict_name}. ${row.dyad_name}. ${validEstimates ? `Reported deaths: best estimate ${row.best}; range ${row.low}–${row.high}.` : `Source estimates inconsistent: best ${row.best}; lower ${row.low}; upper ${row.high}.`} One reported event, not a country total.`,
        referencePeriod: { start, end },
        measurements: [
          { metric: "conflict-incidents", value: 1 },
          ...(validEstimates
            ? [
                { metric: "conflict-fatalities" as const, value: row.best },
                { metric: "conflict-fatalities-low" as const, value: row.low },
                {
                  metric: "conflict-fatalities-high" as const,
                  value: row.high,
                },
              ]
            : []),
        ],
        source: {
          label: `UCDP Candidate Events ${feed.version}`,
          url: feed.source,
          published: null,
          reviewed: feed.retrievedAt,
        },
        ...(country?.iso3
          ? {
              reportingArea: {
                countryCode: country.iso3,
                adminLevel: 0,
                admin1Code: null,
                admin2Code: null,
              },
            }
          : {}),
      });
    } catch {
      skipped++;
    }
  }
  return {
    issues,
    skipped,
    truncated: false,
    warnings,
    message: warnings
      ? `${warnings} events have inconsistent source fatality estimates; those measures are unavailable.`
      : undefined,
  };
}

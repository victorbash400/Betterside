import { z } from "zod";
import type { IssueKind, MapItem } from "../types.ts";
import { countryIndex, feedDate, type Country } from "./shared.ts";
export const ifrcSchema = z.object({
  next: z.string().nullable(),
  results: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      summary: z.string().nullable(),
      disaster_start_date: feedDate.nullable(),
      created_at: feedDate,
      updated_at: feedDate,
      glide: z.string().nullable(),
      ifrc_severity_level_display: z.string().nullable(),
      dtype: z.object({ id: z.number(), name: z.string() }).nullable(),
      countries: z.array(
        z.object({ iso3: z.string().nullable(), name: z.string() }),
      ),
    }),
  ),
});
const types: Record<number, { kind: IssueKind; category: string }> = {
  1: { kind: "Health", category: "disease" },
  66: { kind: "Health", category: "health" },
  7: { kind: "Conflict", category: "conflict" },
  6: { kind: "Humanitarian needs", category: "humanitarian-needs" },
  5: { kind: "Displacement", category: "displaced-families" },
  21: { kind: "Hunger", category: "food-security" },
  20: { kind: "Disaster response", category: "drought-response" },
  2: { kind: "Disaster response", category: "earthquake-response" },
  4: { kind: "Disaster response", category: "storm-response" },
  12: { kind: "Disaster response", category: "flood-response" },
  27: { kind: "Disaster response", category: "flood-response" },
  15: { kind: "Disaster response", category: "wildfire-response" },
  8: { kind: "Disaster response", category: "volcano-response" },
};
export function ifrcEvents(
  raw: unknown,
  countries: Country[],
  reviewed: string,
) {
  const index = countryIndex(countries);
  let skipped = 0;
  const issues = ifrcSchema.parse(raw).results.flatMap((event): MapItem[] => {
    const country =
      event.countries.length === 1
        ? index.get(event.countries[0].iso3 ?? "")
        : undefined;
    if (!country?.centroid) {
      skipped++;
      return [];
    }
    const type = event.dtype ? types[event.dtype.id] : undefined;
    return [
      {
        id: `ifrc:${event.id}`,
        location: event.name,
        country: country.name,
        coordinates: country.centroid.coordinates,
        kind: type?.kind ?? "Disaster response",
        categoryIds: [type?.category ?? "disaster-response"],
        severity: "Insufficient data",
        summary: event.summary ?? "",
        dataset: "ifrc",
        recordType: "Emergency",
        geographicPrecision: "Country centroid",
        source: {
          label: "IFRC GO",
          url: `https://go.ifrc.org/emergencies/${event.id}`,
          published: event.updated_at,
          reviewed,
        },
        sourceAlert: event.ifrc_severity_level_display
          ? `IFRC: ${event.ifrc_severity_level_display}`
          : undefined,
        referencePeriod: event.disaster_start_date
          ? { start: event.disaster_start_date, end: null }
          : undefined,
        eventType: event.dtype ? String(event.dtype.id) : undefined,
        reportingArea: {
          countryCode: country.iso3!,
          adminLevel: 0,
          admin1Code: null,
          admin2Code: null,
        },
        identities: event.glide
          ? [`glide:${event.glide.trim().toUpperCase()}`]
          : [],
      },
    ];
  });
  return { issues, skipped };
}

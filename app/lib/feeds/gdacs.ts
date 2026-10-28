import { z } from "zod";
import type { MapItem } from "../types.ts";
import { feedDate, pointSchema } from "./shared.ts";
export const gdacsSchema = z.object({ features: z.array(z.object({
  geometry: pointSchema,
  properties: z.object({
    eventtype: z.string(), eventid: z.number(), name: z.string(), description: z.string(),
    country: z.string(), fromdate: feedDate, todate: feedDate,
    datemodified: feedDate, glide: z.string(), alertlevel: z.string(),
    source: z.string(), sourceid: z.string(),
    url: z.object({ report: z.url() }),
  }),
})) });
const categories: Record<string, string> = {
  EQ: "earthquake-response", TC: "storm-response", FL: "flood-response",
  VO: "volcano-response", DR: "drought-response", WF: "wildfire-response",
};
export function gdacsEvents(raw: unknown, reviewed: string): MapItem[] {
  return gdacsSchema.parse(raw).features.map(({ geometry, properties: event }) => ({
    id: `gdacs:${event.eventtype}:${event.eventid}`,
    location: event.name, country: event.country, coordinates: geometry.coordinates,
    kind: "Disaster response", severity: "Insufficient data", summary: event.description,
    source: { label: "GDACS", url: event.url.report, published: event.datemodified, reviewed },
    dataset: "gdacs", recordType: "Observation", geographicPrecision: "Event location",
    categoryIds: [categories[event.eventtype] ?? "disaster-response"],
    sourceAlert: `GDACS: ${event.alertlevel}`,
    referencePeriod: { start: event.fromdate, end: event.todate },
    identities: [
      `gdacs:${event.eventtype}:${event.eventid}`,
      ...(event.glide ? [`glide:${event.glide.trim().toUpperCase()}`] : []),
      ...(event.source === "USGS" && event.sourceid ? [`usgs:${event.sourceid}`] : []),
    ],
  }));
}

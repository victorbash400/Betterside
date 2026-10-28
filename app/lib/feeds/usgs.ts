import { z } from "zod";
import type { MapItem } from "../types.ts";
import { coordinatesSchema } from "./shared.ts";
export const usgsSchema = z.object({
  features: z.array(
    z.object({
      id: z.string(),
      geometry: z.object({
        type: z.literal("Point"),
        coordinates: coordinatesSchema.rest(z.number()),
      }),
      properties: z.object({
        title: z.string(),
        time: z.number(),
        updated: z.number(),
        url: z.url(),
        alert: z.string().nullable(),
        ids: z.string(),
        type: z.string(),
      }),
    }),
  ),
});
export function usgsEvents(raw: unknown, reviewed: string): MapItem[] {
  return usgsSchema
    .parse(raw)
    .features.filter((event) => event.properties.type === "earthquake")
    .map((event) => ({
      id: `usgs:${event.id}`,
      location: event.properties.title,
      country: "",
      coordinates: [
        event.geometry.coordinates[0],
        event.geometry.coordinates[1],
      ],
      kind: "Disaster response",
      severity: "Insufficient data",
      summary: "",
      source: {
        label: "USGS",
        url: event.properties.url,
        published: new Date(event.properties.time).toISOString(),
        reviewed,
      },
      dataset: "usgs",
      recordType: "Observation",
      geographicPrecision: "Event location",
      categoryIds: ["earthquake-response"],
      sourceAlert: event.properties.alert
        ? `USGS PAGER: ${event.properties.alert}`
        : undefined,
      identities: event.properties.ids
        .split(",")
        .filter(Boolean)
        .map((id) => `usgs:${id}`),
    }));
}

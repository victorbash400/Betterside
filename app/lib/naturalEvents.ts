import { z } from "zod";
import { sourceUrlIdentity } from "./feeds/shared.ts";
import type { MapItem } from "./types.ts";
const geometry = z.object({
  date: z.iso.datetime({ offset: true }),
  type: z.string(),
  coordinates: z.unknown(),
});
const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  link: z.url(),
  closed: z.string().nullable(),
  categories: z.array(z.object({ id: z.string(), title: z.string() })),
  sources: z.array(z.object({ id: z.string(), url: z.url() })),
  geometry: z.array(geometry),
});
export const eventFeedSchema = z.object({ events: z.array(eventSchema) });
const coordinateSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
]);
const categoryIds: Record<string, string> = {
  wildfires: "wildfire-response",
  severeStorms: "storm-response",
  floods: "flood-response",
  drought: "drought-response",
  earthquakes: "earthquake-response",
  volcanoes: "volcano-response",
};
export function naturalEvents(raw: unknown, reviewed: string): MapItem[] {
  return eventFeedSchema.parse(raw).events.flatMap((event) => {
    const latest = event.geometry
      .filter((point) => point.type === "Point")
      .toSorted((a, b) => Date.parse(b.date) - Date.parse(a.date))[0];
    if (!latest) return [];
    const coordinates = coordinateSchema.safeParse(latest.coordinates);
    if (!coordinates.success) return [];
    return [
      {
        id: `nasa:${event.id}`,
        location: event.title,
        country: "",
        coordinates: coordinates.data,
        kind: "Disaster response",
        severity: "Insufficient data",
        summary: event.description ?? "",
        source: {
          label: "NASA EONET",
          url: event.link,
          published: latest.date,
          reviewed,
        },
        dataset: "eonet",
        recordType: "Observation",
        geographicPrecision: "Event location",
        identities: event.sources.map((source) => sourceUrlIdentity(source.url)),
        categoryIds: event.categories.map(
          (category) => categoryIds[category.id] ?? "disaster-response",
        ),
        eventStatus: event.closed ? "Closed" : "Open",
      },
    ];
  });
}

import { z } from "zod";
import type { MultiPolygon } from "geojson";
const position = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
]);
export const mapAreaSchema = z.object({
  name: z.string(),
  coordinates: position,
  geometry: z.object({
    type: z.literal("MultiPolygon"),
    coordinates: z.array(z.array(z.array(position).min(4))),
  }),
  source: z.string(),
  url: z.url(),
});
export const mapGeographySchema = z.record(z.string(), mapAreaSchema);
export type MapArea = {
  name: string;
  coordinates: [number, number];
  geometry: MultiPolygon;
  source: string;
  url: string;
};
export type MapGeography = Record<string, MapArea>;

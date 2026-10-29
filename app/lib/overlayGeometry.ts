import type { FeatureCollection, Point, Polygon, MultiPolygon } from "geojson";
import type { OverlayPoint } from "./overlayData.ts";
import { concernColor, type OverlaySettings } from "./concerns.ts";
export function overlayGeometry(
  points: OverlayPoint[],
  settings: OverlaySettings,
) {
  const markers: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: [],
  };
  const columns: FeatureCollection<Polygon> = {
    type: "FeatureCollection",
    features: [],
  };
  const areas: FeatureCollection<MultiPolygon> = {
    type: "FeatureCollection",
    features: [],
  };
  for (const point of points) {
    const located = point.records.every(
      (record) => record.geographicPrecision === "Event location",
    );
    if (settings.mode === "Heatmap" && !located) continue;
    if (settings.mode === "Areas" && !point.area) continue;
    const longitudeScale = Math.max(
      0.15,
      Math.cos((point.coordinates[1] * Math.PI) / 180),
    );
    const coordinates = point.coordinates;
    const properties = {
      id: point.id,
      concern: point.concern,
      color: concernColor(point.concern, settings),
      weight: point.weight,
      value: point.value,
      area: Boolean(point.area),
      located,
    };
    if (point.area && settings.mode !== "Heatmap")
      areas.features.push({
        type: "Feature",
        geometry: point.area.geometry,
        properties,
      });
    if (settings.mode !== "Heatmap" || located)
      markers.features.push({
        type: "Feature",
        id: point.id,
        geometry: { type: "Point", coordinates },
        properties,
      });
    if (settings.mode === "Heatmap" || settings.mode === "Areas") continue;
    let footprint = 43000;
    if (point.area) {
      const positions = point.area.geometry.coordinates.flat(2);
      const xs = positions.map((position) => position[0]),
        ys = positions.map((position) => position[1]);
      footprint = Math.max(
        1200,
        Math.min(
          43000,
          (Math.max(...xs) - Math.min(...xs)) * 111320 * longitudeScale * 0.12,
          (Math.max(...ys) - Math.min(...ys)) * 111320 * 0.12,
        ),
      );
    }
    const height = Math.max(0.03, point.weight) * settings.height,
      steps = settings.mode === "Spikes" ? 12 : 1;
    for (let step = 0; step < steps; step++) {
      const radius =
        settings.mode === "Spikes" ? footprint * (1 - step / steps) : footprint;
      const dx = radius / (111320 * longitudeScale),
        dy = radius / 111320;
      const ring: number[][] = [
        [coordinates[0] - dx, coordinates[1] - dy],
        [coordinates[0] + dx, coordinates[1] - dy],
        [coordinates[0] + dx, coordinates[1] + dy],
        [coordinates[0] - dx, coordinates[1] + dy],
        [coordinates[0] - dx, coordinates[1] - dy],
      ];
      columns.features.push({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [ring] },
        properties: {
          ...properties,
          base: (height * step) / steps,
          height: (height * (step + 1)) / steps,
        },
      });
    }
  }
  return { markers, columns, areas };
}

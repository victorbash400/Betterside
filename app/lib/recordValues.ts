import type { MapItem } from "./types.ts";
import { measurementLabels } from "./measurementLabels.ts";

export function recordValue(item: MapItem) {
  return item.measurements?.[0]?.value ?? null;
}

export function recordUnit(item: MapItem) {
  const measurement = item.measurements?.[0];
  return measurement
    ? measurementLabels[measurement.metric]
    : "Unquantified report";
}

export function recordPrecision(item: MapItem) {
  if (item.locationPrecision) return item.locationPrecision.label;
  if (item.geographicPrecision === "Event location") return "Event location";
  if ((item.reportingArea?.adminLevel ?? 0) > 0) return "Administrative area";
  return item.geographicPrecision === "Country centroid"
    ? "Country report"
    : "Reported location";
}

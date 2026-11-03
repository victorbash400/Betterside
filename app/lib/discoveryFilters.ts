import type { MapItem } from "./types.ts";
export interface DiscoveryFilters {
  country: string;
  countryCode?: string;
  recordType: string;
  precision: string;
}
export const defaultDiscoveryFilters: DiscoveryFilters = {
  country: "",
  recordType: "",
  precision: "",
};
export function matchesDiscoveryFilters(
  item: MapItem,
  filters: DiscoveryFilters,
) {
  return (
    (!filters.country ||
      (filters.countryCode && item.reportingArea
        ? item.reportingArea.countryCode === filters.countryCode
        : item.country === filters.country)) &&
    (!filters.recordType || item.recordType === filters.recordType) &&
    (!filters.precision ||
      (filters.precision === "Administrative area"
        ? (item.reportingArea?.adminLevel ?? 0) > 0
        : filters.precision === "Country centroid"
          ? (item.reportingArea?.adminLevel ?? 0) === 0 &&
            item.geographicPrecision === "Country centroid"
          : item.geographicPrecision === filters.precision))
  );
}

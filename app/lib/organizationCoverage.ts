import type { FeatureCollection, MultiPolygon } from "geojson";
import type { DirectoryOrganization } from "./organizations.ts";
import type { MapGeography } from "./mapGeography.ts";
export function organizationCoverageGeometry(
  organizations: DirectoryOrganization[],
  geography: MapGeography,
) {
  const areas = new Map<string, Set<string>>();
  for (const org of organizations)
    for (const presence of org.presence) {
      const key =
        presence.areaCode && geography[presence.areaCode]
          ? presence.areaCode
          : presence.countryCode;
      if (!geography[key]) continue;
      const ids = areas.get(key) ?? new Set<string>();
      ids.add(org.id);
      areas.set(key, ids);
    }
  const data: FeatureCollection<MultiPolygon> = {
    type: "FeatureCollection",
    features: [],
  };
  for (const [code, ids] of areas)
    data.features.push({
      type: "Feature",
      geometry: geography[code].geometry,
      properties: { id: code, count: ids.size },
    });
  return data;
}

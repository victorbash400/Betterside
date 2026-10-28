import type { Map as GlobeMap, GeoJSONSource } from "maplibre-gl";
import type { FeatureCollection, MultiPolygon } from "geojson";
import type { DirectoryOrganization } from "../../lib/organizations";
import type { MapGeography } from "../../lib/mapGeography";
export function addOrganizationLayers(map: GlobeMap) {
  map.addSource("organization-areas", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  map.addLayer({
    id: "organization-areas",
    type: "fill",
    source: "organization-areas",
    paint: {
      "fill-color": "#3d7777",
      "fill-opacity": [
        "interpolate",
        ["linear"],
        ["get", "count"],
        1,
        0.28,
        10,
        0.6,
        50,
        0.8,
      ],
    },
  });
}
export function organizationMapGeometry(
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
export function updateOrganizationLayers(
  map: GlobeMap,
  organizations: DirectoryOrganization[],
  geography: MapGeography,
) {
  map
    .getSource<GeoJSONSource>("organization-areas")
    ?.setData(organizationMapGeometry(organizations, geography));
}

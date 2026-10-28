import type { Map, GeoJSONSource, ExpressionSpecification } from "maplibre-gl";
import {
  concerns,
  concernColor,
  type OverlaySettings,
} from "../../lib/concerns";
import type { OverlayPoint } from "../../lib/overlayData";
import { overlayGeometry } from "../../lib/overlayGeometry";
export function addConcernLayers(map: Map) {
  const empty = { type: "FeatureCollection" as const, features: [] };
  map.addSource("concern-points", { type: "geojson", data: empty });
  map.addSource("concern-areas", { type: "geojson", data: empty });
  map.addSource("concern-columns", { type: "geojson", data: empty });
  map.addLayer({
    id: "concern-areas",
    type: "fill",
    source: "concern-areas",
    paint: {
      "fill-color": ["get", "color"],
      "fill-opacity": ["*", ["get", "weight"], 0.5],
    },
  });
  for (const concern of concerns)
    map.addLayer({
      id: `heat-${concern.id}`,
      type: "heatmap",
      source: "concern-points",
      filter: [
        "all",
        ["==", ["get", "concern"], concern.id],
        ["==", ["get", "located"], true],
      ],
      paint: {
        "heatmap-weight": [
          "case",
          ["==", ["get", "value"], null],
          1,
          ["get", "weight"],
        ],
        "heatmap-radius": 24,
        "heatmap-intensity": 1.4,
        "heatmap-opacity": 0.75,
      },
    });
  map.addLayer({
    id: "concern-columns",
    type: "fill-extrusion",
    source: "concern-columns",
    paint: {
      "fill-extrusion-color": ["get", "color"],
      "fill-extrusion-height": ["get", "height"],
      "fill-extrusion-base": ["get", "base"],
      "fill-extrusion-opacity": 0.85,
      "fill-extrusion-vertical-gradient": true,
    },
  });
  map.addLayer({
    id: "concern-hit",
    type: "circle",
    source: "concern-points",
    paint: { "circle-radius": 14, "circle-opacity": 0 },
  });
}
function rgb(hex: string) {
  return [1, 3, 5]
    .map((start) => Number.parseInt(hex.slice(start, start + 2), 16))
    .join(",");
}
export function updateConcernLayers(
  map: Map,
  points: OverlayPoint[],
  settings: OverlaySettings,
) {
  const geometry = overlayGeometry(points, settings);
  map.getSource<GeoJSONSource>("concern-points")?.setData(geometry.markers);
  map.getSource<GeoJSONSource>("concern-columns")?.setData(geometry.columns);
  map.getSource<GeoJSONSource>("concern-areas")?.setData(geometry.areas);
  map.setLayoutProperty(
    "concern-areas",
    "visibility",
    settings.mode === "Areas" || settings.mode === "Heatmap"
      ? "visible"
      : "none",
  );
  map.setPaintProperty("concern-areas", "fill-opacity", [
    "case",
    ["==", ["get", "value"], null],
    settings.opacity * 0.45,
    ["*", ["max", 0.2, ["get", "weight"]], settings.opacity * 0.8],
  ]);
  for (const concern of concerns) {
    const visible =
        settings.mode === "Heatmap" && settings.concerns.includes(concern.id),
      color = concernColor(concern.id, settings);
    const gradient: ExpressionSpecification = [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      `rgba(${rgb(color)},0)`,
      0.05,
      `rgba(${rgb(color)},0.25)`,
      0.25,
      `rgba(${rgb(color)},0.7)`,
      0.85,
      color,
      1,
      color,
    ];
    map.setLayoutProperty(
      `heat-${concern.id}`,
      "visibility",
      visible ? "visible" : "none",
    );
    map.setPaintProperty(`heat-${concern.id}`, "heatmap-color", gradient);
    map.setPaintProperty(
      `heat-${concern.id}`,
      "heatmap-opacity",
      settings.opacity,
    );
    map.setPaintProperty(
      `heat-${concern.id}`,
      "heatmap-radius",
      settings.radius,
    );
  }
  map.setLayoutProperty(
    "concern-columns",
    "visibility",
    settings.mode === "Heatmap" || settings.mode === "Areas"
      ? "none"
      : "visible",
  );
  map.setPaintProperty(
    "concern-columns",
    "fill-extrusion-opacity",
    settings.opacity,
  );
}

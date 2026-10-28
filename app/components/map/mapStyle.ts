import type { ExpressionSpecification, StyleSpecification } from "maplibre-gl";

export function cleanMapStyle(style: StyleSpecification): StyleSpecification {
  return {
    ...style,
    projection: { type: "globe" },
    layers: style.layers
      .filter((layer) => layer.type !== "raster")
      .map((layer) => {
        const source =
          "source-layer" in layer ? layer["source-layer"] : undefined;
        if (
          layer.type === "symbol" &&
          source === "poi" &&
          layer.layout?.["icon-image"]
        )
          return {
            ...layer,
            layout: {
              ...layer.layout,
              "icon-image": [
                "match",
                ["get", "class"],
                ["atm", "recycling"],
                "",
                layer.layout["icon-image"] as string | ExpressionSpecification,
              ],
            },
            paint: {
              ...layer.paint,
              "text-color": "#43545f",
              "text-halo-color": "#ffffff",
              "text-halo-width": 1,
            },
          };
        if (layer.type === "background")
          return {
            ...layer,
            paint: { ...layer.paint, "background-color": "#f0f0eb" },
          };
        if (layer.type === "fill") {
          const color =
            source === "water"
              ? "#bcd5e3"
              : source === "building"
                ? "#d1d7db"
                : source === "park" || source === "landcover"
                  ? "#dce7d9"
                  : "#e9eae4";
          return { ...layer, paint: { ...layer.paint, "fill-color": color } };
        }
        if (layer.type === "fill-extrusion")
          return {
            ...layer,
            paint: {
              ...layer.paint,
              "fill-extrusion-color": "#cdd4d9",
              "fill-extrusion-opacity": 1,
            },
          };
        if (layer.type === "line" && source === "transportation")
          return {
            ...layer,
            paint: {
              ...layer.paint,
              "line-color": layer.id.endsWith("casing") ? "#b7c0c7" : "#ffffff",
            },
          };
        if (layer.type === "symbol" && layer.layout?.["text-field"])
          return {
            ...layer,
            paint: {
              ...layer.paint,
              "text-color": "#43545f",
              "text-halo-color": "#ffffff",
              "text-halo-width": 1,
            },
          };
        return layer;
      }),
  };
}

export function applyMapView(
  map: import("maplibre-gl").Map,
  settings: import("../../lib/mapViews").MapViewSettings,
) {
  const dark = settings.basemap === "Dark";
  const style = map.getStyle();
  if (!style) return;
  for (const layer of style.layers) {
    if (
      layer.id.startsWith("concern") ||
      layer.id.startsWith("heat-") ||
      layer.id.startsWith("organization-")
    )
      continue;
    const source = "source-layer" in layer ? layer["source-layer"] : "";
    if (layer.type === "background")
      map.setPaintProperty(
        layer.id,
        "background-color",
        dark ? "#26323b" : "#e9ede8",
      );
    if (layer.type === "fill")
      map.setPaintProperty(
        layer.id,
        "fill-color",
        source === "water"
          ? dark
            ? "#101e2b"
            : "#9fbfcf"
          : source === "park" || source === "landcover"
            ? dark
              ? "#293e3c"
              : "#d8e3d5"
            : dark
              ? "#303c44"
              : "#e9ede8",
      );
    if (layer.type === "line" && source === "boundary") {
      map.setLayoutProperty(
        layer.id,
        "visibility",
        settings.boundaries ? "visible" : "none",
      );
      map.setPaintProperty(
        layer.id,
        "line-color",
        dark ? "#83929a" : "#83918f",
      );
    }
    if (layer.type === "symbol") {
      const visible =
        settings.labels &&
        !["poi", "transportation_name", "water_name"].includes(String(source));
      map.setLayoutProperty(
        layer.id,
        "visibility",
        visible ? "visible" : "none",
      );
      if (layer.layout?.["text-field"]) {
        map.setLayoutProperty(layer.id, "text-field", [
          "coalesce",
          ["get", "name:en"],
          ["get", "name"],
        ]);
        map.setPaintProperty(
          layer.id,
          "text-color",
          dark ? "#cbd6dd" : "#394c54",
        );
        map.setPaintProperty(
          layer.id,
          "text-halo-color",
          dark ? "#26333d" : "#f5f7f2",
        );
        map.setPaintProperty(layer.id, "text-halo-width", 1.2);
      }
    }
  }
  map.setSky({
    "sky-color": dark ? "#111922" : "#e8eff4",
    "horizon-color": dark ? "#5787a4" : "#c2d9e6",
    "sky-horizon-blend": 0.65,
    "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.75, 5, 0],
  });
}

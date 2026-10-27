import type { StyleSpecification } from "maplibre-gl";
export function cleanMapStyle(style: StyleSpecification): StyleSpecification {
  return {
    ...style,
    projection: { type: "globe" },
    layers: style.layers
      .filter(
        (layer) =>
          layer.type !== "raster" &&
          !("source-layer" in layer && layer["source-layer"] === "poi"),
      )
      .map((layer) => {
        const source =
          "source-layer" in layer ? layer["source-layer"] : undefined;
        if (layer.type === "background")
          return {
            ...layer,
            paint: { ...layer.paint, "background-color": "#f2f2ed" },
          };
        if (layer.type === "fill")
          return {
            ...layer,
            paint: {
              ...layer.paint,
              "fill-color":
                source === "water"
                  ? "#c5d5d8"
                  : source === "park" || source === "landcover"
                    ? "#e2e7dd"
                    : "#f1f0e8",
            },
          };
        if (layer.type === "line" && source === "boundary")
          return {
            ...layer,
            paint: {
              ...layer.paint,
              "line-color": "#b8beb5",
              "line-opacity": 0.65,
            },
          };
        if (layer.type === "symbol" && layer.layout?.["text-field"])
          return {
            ...layer,
            paint: {
              ...layer.paint,
              "text-color": "#747c73",
              "text-halo-color": "#f4f4ef",
              "text-halo-width": 1,
            },
          };
        return layer;
      }),
  };
}

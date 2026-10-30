import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { Point } from "geojson";
import { Map, setWorkerUrl } from "maplibre-gl";
import { cleanMapStyle } from "./mapStyle";
import { addConcernLayers } from "./concernLayers";
setWorkerUrl(
  new URL(
    "maplibre-gl/dist/maplibre-gl-worker.mjs",
    import.meta.url,
  ).toString(),
);
export function globeZoom(element: HTMLElement) {
  return Math.log2(
    Math.max(180, Math.min(element.clientWidth, element.clientHeight)) / 150,
  );
}
export function useGlobeMap(
  container: RefObject<HTMLDivElement | null>,
  onPick: (ids: string[]) => void,
) {
  const map = useRef<Map | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const pick = useEffectEvent(onPick);
  useEffect(() => {
    if (!container.current) return;
    const element = container.current;
    setReady(false);
    setError("");
    let instance: Map;
    try {
      instance = new Map({
        container: element,
        center: [28, 18],
        zoom: globeZoom(element),
        attributionControl: false,
        canvasContextAttributes: { antialias: true },
        maxZoom: 17,
      });
    } catch {
      setError("WebGL unavailable. Enable hardware acceleration and retry.");
      return;
    }
    map.current = instance;
    instance.setStyle("https://tiles.openfreemap.org/styles/liberty", {
      transformStyle: (_, style) => cleanMapStyle(style),
    });
    instance.on("load", () => {
      addConcernLayers(instance);
      setReady(true);
    });
    instance.on("click", (event) => {
      if (!instance.getLayer("concern-hit")) return;
      const columns = instance.queryRenderedFeatures(event.point, {
        layers: ["concern-columns", "concern-areas"],
      });
      if (columns.length) {
        pick([
          ...new Set(
            columns.flatMap((feature) =>
              typeof feature.properties.id === "string"
                ? [feature.properties.id]
                : [],
            ),
          ),
        ]);
        return;
      }
      const x = event.point.x,
        y = event.point.y;
      const features = instance.queryRenderedFeatures(
        [
          [x - 24, y - 24],
          [x + 24, y + 24],
        ],
        { layers: ["concern-hit"] },
      );
      const ordered = features
        .filter((feature) => feature.geometry.type === "Point")
        .toSorted((a, b) => {
          const aa = instance.project(
              (a.geometry as Point).coordinates as [number, number],
            ),
            bb = instance.project(
              (b.geometry as Point).coordinates as [number, number],
            );
          return (
            Math.hypot(aa.x - x, aa.y - y) - Math.hypot(bb.x - x, bb.y - y)
          );
        });
      pick([
        ...new Set(
          ordered.flatMap((feature) =>
            typeof feature.properties.id === "string"
              ? [feature.properties.id]
              : [],
          ),
        ),
      ]);
    });
    instance.on("mousemove", (event) => {
      if (instance.getLayer("concern-hit"))
        instance.getCanvas().style.cursor = instance.queryRenderedFeatures(
          event.point,
          { layers: ["concern-hit", "concern-areas", "concern-columns"] },
        ).length
          ? "pointer"
          : "";
    });
    instance.on("error", (event) => {
      if (!instance.isStyleLoaded()) setError("Map tiles could not load.");
      else if (
        event.error?.message?.includes("concern") ||
        event.error?.message?.includes("heat-") ||
        event.error?.message?.includes("organization-")
      )
        setError("Concern overlay could not render.");
    });
    let previous = Math.min(element.clientWidth, element.clientHeight);
    const observer = new ResizeObserver(() => {
      const size = Math.min(element.clientWidth, element.clientHeight);
      instance.resize();
      if (
        instance.getZoom() < 3 &&
        previous > 0 &&
        size > 0 &&
        size !== previous
      )
        instance.setZoom(instance.getZoom() + Math.log2(size / previous));
      previous = size;
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      instance.remove();
      map.current = null;
    };
  }, [attempt, container]);
  return { map, ready, error, retry: () => setAttempt((value) => value + 1) };
}

"use client";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Map, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useNarrowLayout } from "../../state/useNarrowLayout";
import type { MapItem as Issue, Filters } from "../../lib/types";
import MapControls from "./MapControls";

import { cleanMapStyle } from "./mapStyle";
import styles from "./GlobeCanvas.module.css";
setWorkerUrl(
  new URL(
    "maplibre-gl/dist/maplibre-gl-worker.mjs",
    import.meta.url,
  ).toString(),
);
export default function GlobeCanvas({
  issues,
  focusRequest,
  selected,
  metric,
  onSelect,
  projection,
  onProjection,
}: {
  issues: Issue[];
  focusRequest: number;
  selected?: Issue;
  metric: Filters["metric"];
  onSelect: (issue: Issue) => void;
  projection: "globe" | "mercator";
  onProjection: (projection: "globe" | "mercator") => void;
}) {
  const narrow = useNarrowLayout();
  const container = useRef<HTMLDivElement>(null),
    map = useRef<Map | null>(null);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const pick = useEffectEvent((id: string) => {
    const issue = issues.find((item) => item.id === id);
    if (issue) onSelect(issue);
  });
  const resizeFrame = useEffectEvent((instance: Map, ratio: number) => {
    if (
      !selected &&
      projection === "globe" &&
      Number.isFinite(ratio) &&
      ratio > 0
    )
      instance.setZoom(instance.getZoom() + Math.log2(ratio));
  });
  useEffect(() => {
    if (!container.current) return;
    let instance: Map;
    setReady(false);
    setError("");
    try {
      instance = new Map({
        container: container.current,
        center: [28, 15],
        zoom: Math.log2(
          Math.max(
            180,
            Math.min(
              container.current?.clientWidth ?? 600,
              container.current?.clientHeight ?? 600,
            ) * 0.82,
          ) / 150,
        ),
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
      instance.addSource("issues", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterMaxZoom: 4,
        clusterRadius: 34,
      });
      instance.addLayer({
        id: "issue-halo",
        type: "circle",
        source: "issues",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 10, 6, 18],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.12,
        },
      });
      instance.addLayer({
        id: "issue-point",
        type: "circle",
        source: "issues",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 5,
          "circle-color": "#fafaf8",
          "circle-stroke-width": 2,
          "circle-stroke-color": ["get", "color"],
        },
      });
      instance.addLayer({
        id: "issue-hit",
        type: "circle",
        source: "issues",
        filter: ["!", ["has", "point_count"]],
        paint: { "circle-radius": 22, "circle-opacity": 0 },
      });
      instance.addLayer({
        id: "issue-clusters",
        type: "circle",
        source: "issues",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#5a5a58",
          "circle-radius": 16,
          "circle-stroke-color": "#fafaf8",
          "circle-stroke-width": 2,
        },
      });
      instance.addLayer({
        id: "issue-count",
        type: "symbol",
        source: "issues",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 11,
          "text-font": ["Noto Sans Regular"],
        },
        paint: { "text-color": "#ffffff" },
      });
      instance.on("click", "issue-hit", (event) => {
        const id = event.features?.[0]?.properties?.id;
        if (typeof id === "string") pick(id);
      });
      instance.on("click", "issue-clusters", async (event) => {
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        const source = instance.getSource<GeoJSONSource>("issues");
        if (!source) return;
        try {
          const zoom = await source.getClusterExpansionZoom(
            feature.properties.cluster_id,
          );
          instance.easeTo({
            center: feature.geometry.coordinates as [number, number],
            zoom,
            duration: 500,
          });
        } catch {
          setError("Could not expand this area.");
        }
      });
      for (const id of ["issue-hit", "issue-clusters"]) {
        instance.on("mouseenter", id, () => {
          instance.getCanvas().style.cursor = "pointer";
        });
        instance.on("mouseleave", id, () => {
          instance.getCanvas().style.cursor = "";
        });
      }
      setReady(true);
    });
    instance.on("error", (event) => {
      if (!instance.isStyleLoaded()) setError("Map tiles could not load.");
      else if (event.error?.message?.includes("issues"))
        setError("Issue layer could not load.");
    });
    let previousSize = Math.min(
      container.current.clientWidth,
      container.current.clientHeight,
    );
    const observer = new ResizeObserver(() => {
      if (!container.current) return;
      const size = Math.min(
        container.current.clientWidth,
        container.current.clientHeight,
      );
      instance.resize();
      if (previousSize > 0 && size > 0 && size !== previousSize)
        resizeFrame(instance, size / previousSize);
      previousSize = size;
    });
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      instance.remove();
      map.current = null;
    };
  }, [attempt]);
  useEffect(() => {
    if (!ready || !map.current) return;
    map.current.getSource<GeoJSONSource>("issues")?.setData({
      type: "FeatureCollection",
      features: issues
        .filter((issue) => metric !== "Funding gap" || issue.project)
        .map((issue) => ({
          type: "Feature",
          id: issue.id,
          geometry: { type: "Point", coordinates: issue.coordinates },
          properties: {
            id: issue.id,
            color: "#5a5a58",
            severity: issue.severity,
            freshness: !issue.source.published
              ? "Unknown"
              : Date.now() - Date.parse(issue.source.published) > 90 * 86400000
                ? "Outdated"
                : "Recent",
            gap: issue.project
              ? issue.project.target - issue.project.raised
              : 0,
          },
        })),
    });
  }, [ready, issues, metric]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const instance = map.current;
    instance.setProjection({ type: projection });
    instance.setPaintProperty(
      "issue-point",
      "circle-radius",
      metric === "Funding gap"
        ? ["interpolate", ["linear"], ["get", "gap"], 0, 4, 150000, 11]
        : metric === "Severity"
          ? ["match", ["get", "severity"], "Critical", 9, "High", 7, 5]
          : ["match", ["get", "freshness"], "Recent", 8, "Outdated", 6, 4],
    );
    instance.setPaintProperty("issue-point", "circle-color", "#fafaf8");
  }, [ready, projection, metric]);
  useEffect(() => {
    if (!ready || !selected || !map.current) return;
    map.current.flyTo({
      center: selected.coordinates,
      zoom: 4.5,
      padding: {
        top: 0,
        left: 0,
        right: 0,
        bottom: narrow ? map.current.getContainer().clientHeight * 0.67 : 0,
      },
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 900,
    });
  }, [ready, selected, narrow, focusRequest]);
  return (
    <div className={styles.canvas}>
      <div
        ref={container}
        className={styles.map}
        role="region"
        aria-label="Interactive world globe"
      />
      {!ready && !error && (
        <div className={styles.loading} role="status">
          Loading globe
        </div>
      )}
      {error && (
        <div className={styles.error} role="alert">
          {error}
          <button onClick={() => setAttempt((value) => value + 1)}>
            Retry
          </button>
        </div>
      )}
      <MapControls
        globe={projection === "globe"}
        onProjection={() =>
          onProjection(projection === "globe" ? "mercator" : "globe")
        }
        onZoom={(direction) =>
          direction > 0 ? map.current?.zoomIn() : map.current?.zoomOut()
        }
        onReset={() =>
          map.current?.flyTo({
            center: [28, 15],
            zoom: Math.log2(
              Math.max(
                180,
                Math.min(
                  container.current?.clientWidth ?? 600,
                  container.current?.clientHeight ?? 600,
                ) * 0.82,
              ) / 150,
            ),
            pitch: 0,
            bearing: 0,
            padding: { top: 0, left: 0, right: 0, bottom: 0 },
            duration: 500,
          })
        }
      />
      <div className={styles.attribution}>
        <a href="https://openfreemap.org" target="_blank" rel="noreferrer">
          OpenFreeMap
        </a>{" "}
        ·{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap
        </a>
      </div>
    </div>
  );
}

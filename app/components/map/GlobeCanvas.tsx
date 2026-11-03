"use client";
import LoadingRegion from "../controls/LoadingRegion";
import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useNarrowLayout } from "../../state/useNarrowLayout";
import type { MapItem, Filters } from "../../lib/types";
import type { OverlaySettings } from "../../lib/concerns";
import type { useMapGeography } from "../../state/useMapGeography";
import type { OverlayPoint } from "../../lib/overlayData";
import { updateConcernLayers } from "./concernLayers";
import { useGlobeCamera } from "./useGlobeCamera";
import { useGlobeMap, globeZoom } from "./useGlobeMap";
import { applyMapView } from "./mapStyle";
import type { MapViewSettings } from "../../lib/mapViews";
import MapControls from "./MapControls";
import GlobeOrientation, { type OrientationChange } from "./GlobeOrientation";
import ConcernDetails from "./ConcernDetails";
import styles from "./GlobeCanvas.module.css";
export default function GlobeCanvas({
  geography,
  loading = false,
  points,
  issues,
  focusRequest,
  selected,
  onSelect,
  projection,
  onProjection,
  overlay,
  country,
  countryCode,
  focusAreas,
  mapViewSettings: mapView,
}: {
  geography: ReturnType<typeof useMapGeography>;
  loading?: boolean;
  points: OverlayPoint[];
  issues: MapItem[];
  focusRequest: number;
  selected?: MapItem;
  onSelect: (item: MapItem) => void;
  metric?: Filters["metric"];
  projection: "globe" | "mercator";
  onProjection: (projection: "globe" | "mercator") => void;
  overlay: OverlaySettings;
  country: string;
  countryCode?: string;
  focusAreas?: string[];
  mapViewSettings: MapViewSettings;
}) {
  const container = useRef<HTMLDivElement>(null),
    narrow = useNarrowLayout();
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const { map, ready, error, retry } = useGlobeMap(container, setPickedIds);
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    const apply = () => applyMapView(instance, mapView);
    if (instance.isStyleLoaded()) apply();
    else instance.once("idle", apply);
    return () => {
      instance.off("idle", apply);
    };
  }, [ready, map, mapView]);
  const pointIndex = new Map(points.map((point) => [point.id, point]));
  const picked = pickedIds.flatMap((id) => pointIndex.get(id) ?? []);
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    const apply = () => updateConcernLayers(instance, points, overlay);
    if (instance.isStyleLoaded()) apply();
    else instance.once("idle", apply);
    return () => {
      instance.off("idle", apply);
    };
  }, [ready, map, points, overlay]);
  useGlobeCamera(
    map,
    ready,
    projection,
    selected,
    narrow,
    focusRequest,
    country,
    issues.find((item) => item.country === country),
    countryCode,
    geography.areas,
    focusAreas,
  );
  function orient(change: OrientationChange) {
    const instance = map.current;
    if (!instance) return;
    const center = instance.getCenter();
    instance.easeTo({
      center: [
        center.lng + (change.longitude ?? 0),
        Math.max(-75, Math.min(75, center.lat + (change.latitude ?? 0))),
      ],
      bearing: instance.getBearing() + (change.bearing ?? 0),
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 350,
    });
  }
  return (
    <div className={styles.canvas}>
      <div
        ref={container}
        className={styles.map}
        role="region"
        aria-label="Interactive world globe"
      />
      {geography.error && (
        <div className={styles.error} role="alert">
          {geography.error}
          <button onClick={geography.retry}>Retry boundaries</button>
        </div>
      )}
      {(!ready || loading) && !error && !geography.error && (
        <LoadingRegion overlay label="Loading globe" />
      )}
      {error && (
        <div className={styles.error} role="alert">
          {error}
          <button onClick={retry}>Retry</button>
        </div>
      )}
      {ready && (
        <>
          <GlobeOrientation onChange={orient} />
        </>
      )}
      {picked.length > 0 && !selected && (
        <ConcernDetails
          key={pickedIds.join(",")}
          points={picked}
          onSelect={(item) => {
            setPickedIds([]);
            onSelect(item);
          }}
          onClose={() => setPickedIds([])}
        />
      )}
      <MapControls
        globe={projection === "globe"}
        onProjection={() =>
          onProjection(projection === "globe" ? "mercator" : "globe")
        }
        onZoom={(direction) =>
          direction > 0 ? map.current?.zoomIn() : map.current?.zoomOut()
        }
        onReset={() => {
          const instance = map.current;
          if (!instance || !container.current) return;
          setPickedIds([]);
          instance.flyTo({
            center: [28, 18],
            zoom: globeZoom(container.current),
            pitch: 0,
            bearing: 0,
            padding: { top: 0, left: 0, right: 0, bottom: 0 },
            duration: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? 0
              : 500,
          });
        }}
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

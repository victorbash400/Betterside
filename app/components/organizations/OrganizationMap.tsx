import { useEffect, useRef } from "react";
import { useGlobeMap, globeZoom } from "../map/useGlobeMap";
import { applyMapView } from "../map/mapStyle";
import { useMapGeography } from "../../state/useMapGeography";
import type { DirectoryOrganization } from "../../lib/organizations";
import { organizationMapScope } from "../../lib/organizations";
import type { MapViewSettings } from "../../lib/mapViews";
import { updateOrganizationLayers } from "./organizationMapLayers";
import GlobeOrientation from "../map/GlobeOrientation";
import MapControls from "../map/MapControls";
import styles from "../map/GlobeCanvas.module.css";
import layout from "./OrganizationMap.module.css";
export default function OrganizationMap({
  organizations,
  selected,
  country,
  projection,
  onProjection,
  mapView,
  onCountry,
}: {
  organizations: DirectoryOrganization[];
  selected?: DirectoryOrganization;
  country?: string;
  projection: "globe" | "mercator";
  onProjection: (value: "globe" | "mercator") => void;
  mapView: MapViewSettings;
  onCountry: (country: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const geography = useMapGeography();
  const { map, ready, error, retry } = useGlobeMap(
    container,
    (codes) => {
      const code = codes[0];
      const area = code ? geography.areas[code] : undefined;
      if (area) {
        const match = organizations
          .flatMap((org) => org.presence)
          .find((p) => p.areaCode === code || p.countryCode === code);
        if (match) onCountry(match.country);
      }
    },
    true,
  );
  useEffect(() => {
    if (!ready || !map.current) return;
    const instance = map.current;
    const apply = () => {
      applyMapView(instance, mapView);
      instance.setProjection({ type: projection });
      updateOrganizationLayers(
        instance,
        organizationMapScope(organizations, selected, country),
        geography.areas,
      );
    };
    if (instance.isStyleLoaded()) apply();
    else instance.once("idle", apply);
    return () => {
      instance.off("idle", apply);
    };
  }, [
    ready,
    map,
    organizations,
    selected,
    geography.areas,
    mapView,
    projection,
    country,
  ]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const codes = selected
      ? [...new Set(selected.presence.map((area) => area.countryCode))]
      : country
        ? [country]
        : [];
    const positions = codes.flatMap(
      (code) => geography.areas[code]?.geometry.coordinates.flat(2) ?? [],
    );
    if (!positions.length) return;
    if (
      selected &&
      projection === "globe" &&
      codes.length > 1 &&
      container.current
    ) {
      const centers = codes.flatMap((code) =>
        geography.areas[code] ? [geography.areas[code].coordinates] : [],
      );
      map.current.easeTo({
        center: [
          centers.reduce((sum, p) => sum + p[0], 0) / centers.length,
          centers.reduce((sum, p) => sum + p[1], 0) / centers.length,
        ],
        zoom: globeZoom(container.current),
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 400,
      });
      return;
    }
    const xs = positions.map((p) => p[0]),
      ys = positions.map((p) => p[1]);
    if (Math.max(...xs) - Math.min(...xs) < 180)
      map.current.fitBounds(
        [
          [Math.min(...xs), Math.min(...ys)],
          [Math.max(...xs), Math.max(...ys)],
        ],
        { padding: 50, maxZoom: 5, duration: 400 },
      );
  }, [ready, map, country, selected, geography.areas, projection]);
  return (
    <div className={`${styles.canvas} ${layout.canvas}`}>
      <div
        ref={container}
        className={styles.map}
        role="region"
        aria-label="Organization operating areas map"
      />
      {(error || geography.error) && (
        <div role="alert" className={styles.error}>
          {error || geography.error}
          <button onClick={error ? retry : geography.retry}>Retry map</button>
        </div>
      )}
      {ready && (
        <GlobeOrientation
          onChange={(change) => {
            const instance = map.current;
            if (!instance) return;
            const center = instance.getCenter();
            instance.easeTo({
              center: [
                center.lng + (change.longitude ?? 0),
                Math.max(
                  -75,
                  Math.min(75, center.lat + (change.latitude ?? 0)),
                ),
              ],
              bearing: instance.getBearing() + (change.bearing ?? 0),
              duration: 350,
            });
          }}
        />
      )}
      <div className={styles.attribution}>
        <a href="https://openfreemap.org" target="_blank" rel="noreferrer">
          OpenFreeMap
        </a>{" "}
        /{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap
        </a>
      </div>
      <MapControls
        globe={projection === "globe"}
        onProjection={() =>
          onProjection(projection === "globe" ? "mercator" : "globe")
        }
        onZoom={(direction) =>
          map.current?.zoomTo((map.current?.getZoom() ?? 0) + direction)
        }
        onReset={() => {
          if (container.current)
            map.current?.easeTo({
              center: [28, 18],
              zoom: globeZoom(container.current),
              pitch: 0,
              bearing: 0,
              padding: { top: 0, bottom: 0, left: 0, right: 0 },
              duration: 400,
            });
        }}
      />
    </div>
  );
}

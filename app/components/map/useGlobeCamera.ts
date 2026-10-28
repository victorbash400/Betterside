import { useEffect, type RefObject } from "react";
import type { Map } from "maplibre-gl";
import type { MapItem } from "../../lib/types";
import type { MapGeography } from "../../lib/mapGeography";
export function useGlobeCamera(
  map: RefObject<Map | null>,
  ready: boolean,
  projection: "globe" | "mercator",
  selected: MapItem | undefined,
  narrow: boolean,
  focusRequest: number,
  country: string,
  countryRecord: MapItem | undefined,
  countryCode: string | undefined,
  areas: MapGeography,
) {
  useEffect(() => {
    if (!ready || !map.current) return;
    const instance = map.current;
    const apply = () => {
      if (instance.getProjection().type !== projection)
        instance.setProjection({ type: projection });
    };
    if (instance.isStyleLoaded()) apply();
    else instance.once("idle", apply);
    return () => {
      instance.off("idle", apply);
    };
  }, [ready, map, projection]);
  useEffect(() => {
    if (!ready || !map.current) return;
    if (!selected) {
      const padding = map.current.getPadding();
      if (padding.top || padding.right || padding.bottom || padding.left)
        map.current.setPadding({ top: 0, right: 0, bottom: 0, left: 0 });
      return;
    }
    map.current.flyTo({
      center:
        (selected.reportingArea
          ? areas[
              selected.reportingArea.admin2Code ??
                selected.reportingArea.admin1Code ??
                selected.reportingArea.countryCode
            ]?.coordinates
          : undefined) ?? selected.coordinates,
      zoom: 4.5,
      padding: {
        top: 0,
        left: 0,
        right: 0,
        bottom: narrow ? map.current.getContainer().clientHeight * 0.6 : 0,
      },
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 600,
    });
  }, [ready, map, selected, narrow, focusRequest, areas]);

  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance || !country || selected) return;
    const record = countryRecord;
    const code = countryCode ?? record?.reportingArea?.countryCode;
    const area = code ? areas[code] : undefined;
    if (!area && !record) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 500;
    const focus = () => {
      const positions = area?.geometry.coordinates.flat(2);
      if (positions?.length) {
        const xs = positions.map((position) => position[0]),
          ys = positions.map((position) => position[1]);
        if (Math.max(...xs) - Math.min(...xs) < 180) {
          instance.fitBounds(
            [
              [Math.min(...xs), Math.min(...ys)],
              [Math.max(...xs), Math.max(...ys)],
            ],
            { padding: 44, duration, maxZoom: 6 },
          );
          return;
        }
      }
      instance.flyTo({
        center: area?.coordinates ?? record!.coordinates,
        zoom: 3.5,
        duration,
      });
    };
    if (instance.isStyleLoaded()) focus();
    else instance.once("idle", focus);
    return () => {
      instance.off("idle", focus);
    };
  }, [ready, map, country, countryRecord, countryCode, areas, selected]);
}

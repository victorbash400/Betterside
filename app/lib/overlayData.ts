import type { MapGeography, MapArea } from "./mapGeography.ts";
import type { MapItem } from "./types.ts";
import {
  concerns,
  matchesConcern,
  concernMeasurement,
  type ConcernId,
  type OverlaySettings,
} from "./concerns.ts";
export interface OverlayPoint {
  id: string;
  concern: ConcernId;
  location: string;
  coordinates: [number, number];
  value: number | null;
  weight: number;
  records: MapItem[];
  area?: MapArea;
  precision?: string;
  period?: MapItem["referencePeriod"];
}
export function overlayPoints(
  records: MapItem[],
  settings: Pick<OverlaySettings, "concerns" | "scale">,
  geography: MapGeography = {},
): OverlayPoint[] {
  const points: OverlayPoint[] = [];
  for (const concern of settings.concerns) {
    const groups = new Map<string, MapItem[]>();
    const matching = records.filter((record) =>
      matchesConcern(record, concern),
    );
    const nationalPeriods = new Set(
      matching
        .filter(
          (item) =>
            item.recordType !== "Observation" &&
            item.reportingArea?.adminLevel === 0 &&
            concernMeasurement(item, concern) !== undefined,
        )
        .map((item) =>
          JSON.stringify([
            item.reportingArea!.countryCode,
            item.referencePeriod?.start,
          ]),
        ),
    );
    for (const item of matching) {
      if (
        (item.reportingArea?.adminLevel ?? 0) > 0 &&
        nationalPeriods.has(
          JSON.stringify([
            item.reportingArea!.countryCode,
            item.referencePeriod?.start,
          ]),
        )
      )
        continue;
      const areaCode =
        item.reportingArea?.admin2Code &&
        geography[item.reportingArea.admin2Code]
          ? item.reportingArea.admin2Code
          : item.reportingArea?.admin1Code;
      const key =
        item.dataset === "ucdp" && item.geographicPrecision === "Country centroid"
          ? `ucdp-unlocated:${item.country}`
          : item.geographicPrecision === "Event location" ||
              (item.dataset === "ucdp" &&
                item.geographicPrecision === "Administrative area")
            ? item.id
            : areaCode && geography[areaCode]
              ? areaCode
              : (item.reportingArea?.countryCode ?? (item.country || item.id));
      const group = groups.get(key) ?? [];
      group.push(item);
      groups.set(key, group);
    }
    const layer: OverlayPoint[] = [];
    for (const [key, group] of groups) {
      let measured = group.filter(
        (item) => concernMeasurement(item, concern) !== undefined,
      );
      let value: number | null = null;
      let evidence = group;
      if (measured.length) {
        const latest = measured.reduce(
          (date, item) =>
            (item.referencePeriod?.start ?? "") > date
              ? item.referencePeriod!.start
              : date,
          "",
        );
        if (!measured.every((item) => item.recordType === "Observation"))
          measured = measured.filter(
            (item) => (item.referencePeriod?.start ?? "") === latest,
          );
        if (concern === "war") {
          const level = Math.min(
            ...measured.map((item) => item.reportingArea?.adminLevel ?? 0),
          );
          measured = measured.filter(
            (item) => (item.reportingArea?.adminLevel ?? 0) === level,
          );
        }
        const values = measured.map(
          (item) => concernMeasurement(item, concern)!.value,
        );
        // Only disjoint districts within one period/category, or refugee origins,
        // can be added. Overlapping assessments and sectors use one maximum.
        value =
          concern === "war" || concern === "refugees"
            ? values.reduce((sum, current) => sum + current, 0)
            : concern === "rainfall"
              ? values.reduce(
                  (largest, current) =>
                    Math.abs(current) > Math.abs(largest) ? current : largest,
                  0,
                )
              : Math.max(...values);
        evidence = measured;
        if (value === 0) continue;
      } else if (
        concern === "war" &&
        group.every((item) => item.dataset === "hapi-conflict")
      )
        continue;
      const first = evidence[0];
      const area =
        first.recordType === "Observation" ||
        first.geographicPrecision === "Event location"
          ? undefined
          : (geography[key] ??
            (first.reportingArea
              ? geography[first.reportingArea.countryCode]
              : undefined));
      const starts = evidence
        .flatMap((record) =>
          record.referencePeriod ? [record.referencePeriod.start] : [],
        )
        .sort();
      const ends = evidence
        .flatMap((record) =>
          record.referencePeriod?.end ? [record.referencePeriod.end] : [],
        )
        .sort();
      const period =
        evidence.every((record) => record.recordType === "Observation") &&
        starts.length
          ? { start: starts[0], end: ends.at(-1) ?? null }
          : first.referencePeriod;
      layer.push({
        id: `${concern}:${key}`,
        concern,
        area,
        precision:
          first.locationPrecision?.label ??
          (area
            ? first.reportingArea?.admin2Code === key ||
              first.reportingArea?.admin1Code === key
              ? "Administrative area"
              : (first.reportingArea?.adminLevel ?? 0) > 0
                ? "Country aggregate · regional boundaries unavailable"
                : "Country total"
            : first.geographicPrecision),
        location:
          area && key !== first.reportingArea?.countryCode
            ? `${area.name}, ${first.country}`
            : first.geographicPrecision === "Event location"
              ? first.location
              : first.country || first.location,
        coordinates: area?.coordinates ?? first.coordinates,
        value,
        weight: 0,
        records: evidence,
        period,
      });
    }
    const maximum = Math.max(
      0,
      ...layer.map((point) => Math.abs(point.value ?? 0)),
    );
    const eventMaximum = Math.max(
      0,
      ...layer
        .filter((point) =>
          point.records.every(
            (record) => record.geographicPrecision === "Event location",
          ),
        )
        .map((point) => Math.abs(point.value ?? 0)),
    );
    for (const point of layer) {
      const comparableMaximum = point.records.every(
        (record) => record.geographicPrecision === "Event location",
      )
        ? eventMaximum
        : maximum;
      point.weight =
        point.value === null
          ? 0.18
          : settings.scale === "Linear"
            ? Math.abs(point.value) / comparableMaximum
            : Math.log1p(Math.abs(point.value)) / Math.log1p(comparableMaximum);
      points.push(point);
    }
  }
  return points;
}
export function overlayLegend(
  points: OverlayPoint[],
  settings: OverlaySettings,
) {
  return settings.concerns.map((id) => {
    const concern = concerns.find((item) => item.id === id)!;
    const layer = points.filter((point) => point.concern === id);
    const ends = layer
      .flatMap((point) => (point.period?.end ? [point.period.end] : []))
      .sort();
    return {
      ...concern,
      maximum: Math.max(0, ...layer.map((point) => point.value ?? 0)),
      locations: layer.length,
      measured: layer.some((point) => point.value !== null),
      referenceEnd: ends.at(-1),
    };
  });
}

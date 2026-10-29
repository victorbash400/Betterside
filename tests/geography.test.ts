import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mapGeographySchema } from "../app/lib/mapGeography.ts";
import { overlayPoints } from "../app/lib/overlayData.ts";
import { overlayGeometry } from "../app/lib/overlayGeometry.ts";
import { defaultOverlaySettings } from "../app/lib/concerns.ts";
import {
  matchesDiscoveryFilters,
  defaultDiscoveryFilters,
} from "../app/lib/discoveryFilters.ts";
import {
  parseAppearance,
  appearanceVariables,
  lightProfiles,
  defaultAppearance,
} from "../app/lib/appearance.ts";
import type { MapItem } from "../app/lib/types.ts";
const geography = mapGeographySchema.parse(
  JSON.parse(
    readFileSync(
      new URL("../public/geography/areas.json", import.meta.url),
      "utf8",
    ),
  ),
);
const source = {
  label: "Test",
  url: "https://example.org",
  published: "2026-10-21T00:00:00Z",
  reviewed: "2026-10-28T00:00:00Z",
};
const base: MapItem = {
  id: "test",
  location: "Ukraine district",
  country: "Ukraine",
  coordinates: [31, 48],
  kind: "Conflict",
  severity: "Insufficient data",
  summary: "",
  source,
  recordType: "Indicator",
  dataset: "hapi-conflict",
  eventType: "political_violence",
  geographicPrecision: "Country centroid",
  reportingArea: {
    countryCode: "UKR",
    adminLevel: 2,
    admin1Code: "UA14",
    admin2Code: "UA1402",
  },
  measurements: [{ metric: "conflict-events", value: 10 }],
  referencePeriod: {
    start: "2026-10-01T00:00:00Z",
    end: "2026-10-31T23:59:59Z",
  },
};
test("official p-code boundaries preserve Ukrainian district breakdown instead of collapsing it to a country hotspot", () => {
  const codes = Object.keys(geography).filter(
    (code) => code.startsWith("UA") && code.length > 4,
  );
  assert.ok(codes.length >= 137);
  const records = codes.slice(0, 2).map((code) => ({
    ...base,
    id: code,
    reportingArea: { ...base.reportingArea!, admin2Code: code },
  }));
  const points = overlayPoints(
    records,
    { ...defaultOverlaySettings, concerns: ["war"] },
    geography,
  );
  assert.equal(points.length, 2);
  assert.notDeepEqual(points[0].coordinates, points[1].coordinates);
  for (const point of points) {
    assert.equal(point.precision, "Administrative area");
    assert.equal(point.value, 10);
    assert.ok(point.area);
  }
  const geometry = overlayGeometry(points, {
    ...defaultOverlaySettings,
    mode: "Areas",
  });
  assert.equal(geometry.areas.features.length, 2);
  assert.equal(geometry.areas.features[0].properties!.area, true);
  assert.equal(geometry.markers.features.length, 2);
});
test("national totals use country area geometry while incident coordinates remain unchanged", () => {
  const national = {
    ...base,
    reportingArea: {
      countryCode: "UKR",
      adminLevel: 0,
      admin1Code: null,
      admin2Code: null,
    },
  };
  const [point] = overlayPoints(
    [national],
    { ...defaultOverlaySettings, concerns: ["war"] },
    geography,
  );
  assert.equal(point.precision, "Country total");
  assert.equal(point.area, geography.UKR);
  const event = {
    ...base,
    geographicPrecision: "Event location" as const,
    reportingArea: undefined,
  };
  const [incident] = overlayPoints(
    [event],
    { ...defaultOverlaySettings, concerns: ["war"] },
    geography,
  );
  assert.deepEqual(incident.coordinates, base.coordinates);
  assert.equal(incident.area, undefined);
});
test("country, type and administrative precision filters combine without fuzzy country matching", () => {
  assert.equal(
    matchesDiscoveryFilters(base, {
      country: "Ukraine",
      recordType: "Indicator",
      precision: "Administrative area",
    }),
    true,
  );
  assert.equal(
    matchesDiscoveryFilters(base, {
      ...defaultDiscoveryFilters,
      country: "UKR",
    }),
    false,
  );
  assert.equal(
    matchesDiscoveryFilters(base, {
      ...defaultDiscoveryFilters,
      recordType: "Emergency",
    }),
    false,
  );
});
test("Screening Room appearance retains separate theme profiles and derives all UI tokens", () => {
  const value = { ...defaultAppearance, light: lightProfiles[1] };
  assert.deepEqual(parseAppearance(JSON.stringify(value)), value);
  const variables = appearanceVariables(value.light);
  assert.equal(variables["--accent"], lightProfiles[1].accent);
  assert.equal(variables["--surface"], "#FFFFFF");
  assert.throws(() =>
    parseAppearance(
      JSON.stringify({
        ...value,
        light: { ...value.light, accent: "invalid" },
      }),
    ),
  );
});
test("a national total prevents duplicate mapped district totals within the same reporting period", () => {
  const national = {
    ...base,
    id: "national",
    reportingArea: {
      countryCode: "UKR",
      adminLevel: 0,
      admin1Code: null,
      admin2Code: null,
    },
    measurements: [{ metric: "conflict-events" as const, value: 25 }],
  };
  const points = overlayPoints(
    [base, national],
    { ...defaultOverlaySettings, concerns: ["war"] },
    geography,
  );
  assert.equal(points.length, 1);
  assert.equal(points[0].value, 25);
});
test("heatmaps show only incident kernels and reserve national and regional totals for Areas", () => {
  const code = Object.keys(geography).find(
    (code) => code.startsWith("UA") && code.length > 4,
  )!;
  const regional = {
    ...base,
    reportingArea: { ...base.reportingArea!, admin2Code: code },
  };
  const national = {
    ...base,
    id: "national",
    reportingArea: {
      countryCode: "SDN",
      adminLevel: 0,
      admin1Code: null,
      admin2Code: null,
    },
    country: "Sudan",
  };
  const incident = {
    ...base,
    id: "incident",
    geographicPrecision: "Event location" as const,
    reportingArea: undefined,
    coordinates: [33, 49] as [number, number],
  };
  const points = overlayPoints(
    [regional, national, incident],
    { ...defaultOverlaySettings, concerns: ["war"] },
    geography,
  );
  const heatmap = overlayGeometry(points, {
    ...defaultOverlaySettings,
    mode: "Heatmap",
  });
  assert.equal(heatmap.markers.features.length, 1);
  assert.deepEqual(heatmap.markers.features[0].geometry.coordinates, [33, 49]);
  assert.equal(heatmap.areas.features.length, 0);
  assert.equal(heatmap.columns.features.length, 0);
  const areas = overlayGeometry(points, {
    ...defaultOverlaySettings,
    mode: "Areas",
  });
  assert.equal(areas.areas.features.length, 2);
  assert.equal(areas.columns.features.length, 0);
});

test("unmapped country centroids never become incident heat kernels", () => {
  const points = overlayPoints([base], {
    ...defaultOverlaySettings,
    concerns: ["war"],
  });
  const geometry = overlayGeometry(points, {
    ...defaultOverlaySettings,
    mode: "Heatmap",
  });
  assert.equal(geometry.markers.features.length, 0);
  assert.equal(geometry.areas.features.length, 0);
});

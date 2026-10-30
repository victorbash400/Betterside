import test from "node:test";
import assert from "node:assert/strict";
import { overlayPoints } from "../app/lib/overlayData.ts";
import {
  defaultOverlaySettings,
  inOverlayPeriod,
  matchesConcern,
} from "../app/lib/concerns.ts";
import { overlayGeometry } from "../app/lib/overlayGeometry.ts";
import { hapiIndicators } from "../app/lib/feeds/hapi.ts";
import type { MapItem } from "../app/lib/types.ts";
import type { MapArea } from "../app/lib/mapGeography.ts";
const settings = { ...defaultOverlaySettings, concerns: ["war"] as const };
const month = { start: "2026-10-01T00:00:00Z", end: "2026-10-31T23:59:59Z" };
const area: MapArea = {
  name: "Test country",
  coordinates: [31, 48],
  geometry: {
    type: "MultiPolygon",
    coordinates: [
      [
        [
          [30, 47],
          [32, 47],
          [32, 49],
          [30, 49],
          [30, 47],
        ],
      ],
    ],
  },
  source: "Test boundaries",
  url: "https://example.org/boundaries",
};
function record(id: string, value: number, adminLevel = 2): MapItem {
  return {
    id,
    location: id,
    country: "Test country",
    coordinates: [31, 48],
    kind: "Conflict",
    severity: "Insufficient data",
    summary: "",
    source: {
      label: "ACLED",
      url: "https://example.org/source",
      published: "2026-10-21T00:00:00Z",
      reviewed: "2026-10-28T00:00:00Z",
    },
    dataset: "hapi-conflict",
    geographicPrecision: "Country centroid",
    recordType: "Indicator",
    referencePeriod: month,
    eventType: "political_violence",
    reportingArea: {
      countryCode: "TST",
      adminLevel,
      admin1Code: adminLevel ? "TST1" : null,
      admin2Code: adminLevel === 2 ? id : null,
    },
    measurements: [{ metric: "conflict-events", value }],
  };
}
test("war sums covered disjoint districts within one month, not overlapping categories", () => {
  const rows = [
    record("a", 10),
    record("b", 20),
    { ...record("c", 100), eventType: "civilian_targeting" },
  ];
  const points = overlayPoints(rows, {
    ...settings,
    concerns: [...settings.concerns],
  });
  assert.equal(points.length, 1);
  assert.equal(points[0].value, 30);
  assert.equal(points[0].records.length, 2);
});
test("country totals take precedence over districts and reporting months never accumulate", () => {
  const rows = [
    record("a", 10),
    record("b", 20),
    record("national", 25, 0),
    {
      ...record("old", 100, 0),
      referencePeriod: {
        start: "2026-09-01T00:00:00Z",
        end: "2026-09-30T23:59:59Z",
      },
    },
  ];
  const [point] = overlayPoints(rows, {
    ...settings,
    concerns: [...settings.concerns],
  });
  assert.equal(point.value, 25);
  assert.equal(point.records.length, 1);
});
test("a newer zero-valued reporting period prevents an old hotspot reappearing", () => {
  const rows = [
    record("new", 0),
    {
      ...record("old", 100),
      referencePeriod: {
        start: "2026-09-01T00:00:00Z",
        end: "2026-09-30T23:59:59Z",
      },
    },
  ];
  assert.deepEqual(
    overlayPoints(rows, { ...settings, concerns: [...settings.concerns] }),
    [],
  );
});
test("disease report locations never become invented case counts or severity weights", () => {
  const rows = [
    {
      ...record("disease-a", 0),
      kind: "Health" as const,
      dataset: "ifrc" as const,
      categoryIds: ["disease"],
      measurements: [],
    },
    {
      ...record("disease-b", 0),
      kind: "Health" as const,
      dataset: "ifrc" as const,
      categoryIds: ["disease"],
      measurements: [],
    },
  ];
  const points = overlayPoints(rows, {
    ...defaultOverlaySettings,
    concerns: ["disease"],
  });
  assert.equal(points.length, 1);
  assert.equal(points[0].value, null);
  assert.equal(points[0].records.length, 2);
  assert.equal(points[0].weight, 0.18);
});
test("each color normalizes within its own unit and linear/log modes differ", () => {
  const rows = [
    record("a", 10, 0),
    {
      ...record("b", 1000, 0),
      country: "Other",
      reportingArea: {
        countryCode: "OTH",
        adminLevel: 0,
        admin1Code: null,
        admin2Code: null,
      },
    },
  ];
  const linear = overlayPoints(rows, {
    ...defaultOverlaySettings,
    concerns: ["war"],
    scale: "Linear",
  });
  const log = overlayPoints(rows, {
    ...defaultOverlaySettings,
    concerns: ["war"],
    scale: "Logarithmic",
  });
  assert.equal(linear[0].weight, 0.01);
  assert.ok(log[0].weight > linear[0].weight);
  assert.equal(linear[1].weight, 1);
});
test("geometric columns and tapered spikes have bounded finite height and closed footprints", () => {
  const points = overlayPoints([record("a", 10)], {
    ...defaultOverlaySettings,
    concerns: ["war"],
  });
  const columns = overlayGeometry(points, {
    ...defaultOverlaySettings,
    concerns: ["war"],
    mode: "Columns",
  });
  const spikes = overlayGeometry(points, {
    ...defaultOverlaySettings,
    concerns: ["war"],
    mode: "Spikes",
  });
  assert.equal(columns.columns.features.length, 1);
  assert.equal(spikes.columns.features.length, 12);
  for (const feature of spikes.columns.features) {
    const ring = feature.geometry.coordinates[0];
    assert.deepEqual(ring[0], ring.at(-1));
    assert.ok(feature.properties!.height <= defaultOverlaySettings.height);
    assert.ok(feature.properties!.height > feature.properties!.base);
    assert.ok(ring.flat().every(Number.isFinite));
  }
  assert.ok(
    spikes.columns.features.at(-1)!.geometry.coordinates[0][1][0] -
      spikes.columns.features.at(-1)!.geometry.coordinates[0][0][0] <
      spikes.columns.features[0].geometry.coordinates[0][1][0] -
        spikes.columns.features[0].geometry.coordinates[0][0][0],
  );
});
test("co-located concerns preserve their geographic anchor in every mode", () => {
  const rows = [
    record("war", 10),
    {
      ...record("food", 10, 0),
      kind: "Hunger" as const,
      dataset: "hapi-food" as const,
      measurements: [{ metric: "ipc-3-plus" as const, value: 100 }],
    },
  ];
  const points = overlayPoints(rows, {
    ...defaultOverlaySettings,
    concerns: ["war", "hunger"],
  });
  const geometry = overlayGeometry(points, {
    ...defaultOverlaySettings,
    concerns: ["war", "hunger"],
    mode: "Columns",
  });
  assert.deepEqual(
    geometry.markers.features[0].geometry.coordinates,
    geometry.markers.features[1].geometry.coordinates,
  );
  assert.deepEqual(points[0].coordinates, [31, 48]);
  assert.deepEqual(points[1].coordinates, [31, 48]);
});
test("date windows use report reference end and latest view removes closed observations", () => {
  const now = Date.parse("2026-10-28T00:00:00Z");
  assert.equal(
    inOverlayPeriod(
      {
        ...record("old", 10),
        referencePeriod: {
          start: "2026-01-01T00:00:00Z",
          end: "2026-05-31T23:59:59Z",
        },
      },
      "30 days",
      now,
    ),
    false,
  );
  assert.equal(inOverlayPeriod(record("current", 10), "30 days", now), true);
  assert.equal(
    inOverlayPeriod(
      { ...record("closed", 10), eventStatus: "Closed" },
      "Latest",
      now,
    ),
    false,
  );
});
test("disease and Phase 5 are explicit classifications, not all health/food records", () => {
  assert.equal(
    matchesConcern(
      { ...record("health", 10), kind: "Health", categoryIds: ["health"] },
      "disease",
    ),
    false,
  );
  assert.equal(
    matchesConcern(
      { ...record("food", 10), kind: "Hunger", dataset: "hapi-food" },
      "famine",
    ),
    false,
  );
  assert.equal(
    matchesConcern(
      { ...record("phase5", 10), kind: "Hunger", dataset: "hapi-famine" },
      "famine",
    ),
    true,
  );
});
test("Phase 5 source adapter preserves its measure and never declares area-level famine", () => {
  const rows = [
    {
      location_code: "TST",
      location_name: "Test",
      admin_level: 0,
      admin1_code: null,
      admin1_name: null,
      admin2_code: null,
      admin2_name: null,
      resource_hdx_id: "r",
      reference_period_start: month.start,
      reference_period_end: month.end,
      ipc_phase: "5",
      ipc_type: "current",
      population_in_phase: 100,
    },
  ];
  const result = hapiIndicators(
    "hapi-famine",
    { data: rows },
    [
      {
        id: 1,
        iso3: "TST",
        name: "Test",
        record_type: 1,
        is_deprecated: false,
        centroid: { type: "Point", coordinates: [31, 48] },
      },
    ],
    [
      {
        resource_hdx_id: "r",
        hdx_link: "https://example.org/data",
        dataset_hdx_provider_name: "IPC",
        update_date: "2026-10-21T00:00:00Z",
      },
    ],
    "2026-10-28T00:00:00Z",
  );
  assert.equal(result.issues[0].measurements?.[0].value, 100);
  assert.equal(result.issues[0].measurements?.[0].metric, "ipc-5");
  assert.ok(
    result.issues[0].summary.includes("does not establish area-level Famine"),
  );
  assert.equal(result.issues[0].severity, "Insufficient data");
});
test("previously hidden hazards and humanitarian sectors have selectable concerns without becoming other hazards", () => {
  const storm = {
    ...record("storm", 0),
    kind: "Disaster response" as const,
    categoryIds: ["storm-response"],
  };
  assert.equal(matchesConcern(storm, "storms"), true);
  assert.equal(matchesConcern(storm, "other-hazards"), false);
  const shelter = {
    ...record("shelter", 0),
    kind: "Displacement" as const,
    dataset: "hapi-needs" as const,
  };
  assert.equal(matchesConcern(shelter, "shelter"), true);
  const needs = {
    ...record("needs", 0),
    kind: "Humanitarian needs" as const,
    dataset: "hapi-needs" as const,
  };
  assert.equal(matchesConcern(needs, "needs"), true);
  assert.equal(
    matchesConcern({ ...needs, dataset: "hapi-funding" }, "needs"),
    false,
  );
});
test("many co-located layers never displace source locations to avoid overlap", () => {
  const points = overlayPoints([record("a", 10)], {
    ...defaultOverlaySettings,
    concerns: ["war"],
  });
  const many = Array.from({ length: 19 }, (_, index) => ({
    ...points[0],
    id: `point-${index}`,
  }));
  const geometry = overlayGeometry(many, {
    ...defaultOverlaySettings,
    mode: "Columns",
  });
  for (const feature of geometry.markers.features)
    assert.deepEqual(feature.geometry.coordinates, [31, 48]);
});

test("explicitly selected concerns render weighted heatmap anchors without polygon fills or losing aggregate precision", () => {
  const rows: MapItem[] = [
    record("conflict", 12, 0),
    {
      ...record("disease", 0, 0),
      kind: "Health",
      dataset: "ifrc",
      categoryIds: ["disease"],
      measurements: [],
    },
    {
      ...record("food", 0, 0),
      kind: "Hunger",
      dataset: "hapi-food",
      measurements: [{ metric: "ipc-3-plus", value: 50000 }],
    },
  ];
  const points = overlayPoints(
    rows,
    { ...defaultOverlaySettings, concerns: ["war", "disease", "hunger"] },
    { TST: area },
  );
  const geometry = overlayGeometry(points, defaultOverlaySettings);
  assert.equal(geometry.areas.features.length, 0);
  assert.equal(geometry.markers.features.length, 3);
  assert.equal(geometry.columns.features.length, 0);
  assert.deepEqual(
    new Set(
      geometry.markers.features.map((feature) => feature.properties!.concern),
    ),
    new Set(["war", "disease", "hunger"]),
  );
  assert.ok(
    geometry.markers.features.every(
      (feature) => feature.properties!.located === false,
    ),
  );
});

test("heatmap and areas modes keep their geometry separate for mixed precision data", () => {
  const rows: MapItem[] = [
    record("aggregate", 12, 0),
    {
      ...record("event", 0),
      dataset: "usgs",
      kind: "Disaster response",
      categoryIds: ["earthquake-response"],
      geographicPrecision: "Event location",
      measurements: [],
      reportingArea: undefined,
    },
  ];
  const settings = {
    ...defaultOverlaySettings,
    concerns: ["war", "earthquakes"] as typeof defaultOverlaySettings.concerns,
  };
  const points = overlayPoints(rows, settings, { TST: area });
  for (const mode of ["Heatmap", "Areas"] as const) {
    const geometry = overlayGeometry(points, { ...settings, mode });
    assert.equal(geometry.areas.features.length, mode === "Areas" ? 1 : 0);
    assert.equal(geometry.markers.features.length, 2);
    const events = geometry.markers.features.filter(
      (feature) => feature.properties!.located,
    );
    assert.equal(events.length, 1);
    assert.equal(events[0].properties!.value, null);
  }
});

test("rainfall deficits retain their sign while magnitude sets their visual weight", () => {
  const rows: MapItem[] = [
    {
      ...record("rain", 0, 0),
      kind: "Climate",
      dataset: "hapi-rainfall",
      measurements: [{ metric: "rainfall-departure", value: -42 }],
    },
  ];
  const [point] = overlayPoints(rows, {
    ...defaultOverlaySettings,
    concerns: ["rainfall"],
  });
  assert.equal(point.value, -42);
  assert.equal(point.weight, 1);
});

test("aggregate heatmap anchors retain their reported precision when boundaries are unavailable", () => {
  const points = overlayPoints([record("aggregate", 12, 0)], {
    ...defaultOverlaySettings,
    concerns: ["war"],
  });
  const geometry = overlayGeometry(points, defaultOverlaySettings);
  assert.equal(geometry.areas.features.length, 0);
  assert.equal(geometry.markers.features.length, 1);
  assert.equal(geometry.markers.features[0].properties!.located, false);
});

test("IPC hunger and food-assistance needs keep their own values and units", () => {
  const ipc: MapItem = {
    ...record("ipc", 0, 0),
    kind: "Hunger",
    dataset: "hapi-food",
    measurements: [{ metric: "ipc-3-plus", value: 12000 }],
  };
  const assistance: MapItem = {
    ...record("assistance", 0, 0),
    kind: "Hunger",
    dataset: "hapi-needs",
    measurements: [{ metric: "people-in-need", value: 40000 }],
  };
  assert.equal(matchesConcern(assistance, "hunger"), false);
  assert.equal(matchesConcern(assistance, "needs"), true);
  const points = overlayPoints(
    [ipc, assistance],
    { ...defaultOverlaySettings, concerns: ["hunger", "needs"] },
    { TST: area },
  );
  assert.equal(
    points.find((point) => point.concern === "hunger")?.value,
    12000,
  );
  assert.equal(points.find((point) => point.concern === "needs")?.value, 40000);
});

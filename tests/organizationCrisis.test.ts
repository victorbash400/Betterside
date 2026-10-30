import test from "node:test";
import assert from "node:assert/strict";
import {
  organizationCrisisRecords,
  organizationCrisisSelection,
} from "../app/lib/organizationCrisis.ts";
import { pointInArea } from "../app/lib/pointInArea.ts";
import { defaultDatasets } from "../app/lib/dataSources.ts";
import {
  defaultOrganizationFilters,
  directoryOrganizationSchema,
  filterOrganizations,
} from "../app/lib/organizations.ts";
import type { MapItem } from "../app/lib/types.ts";
import type { MapGeography } from "../app/lib/mapGeography.ts";
const evidence = {
  label: "Provider",
  url: "https://example.org/source",
  date: "2026-10-30",
};
const organization = directoryOrganizationSchema.parse({
  id: "org",
  name: "Organization",
  acronym: "",
  type: null,
  identifiers: [],
  topics: ["Hunger", "Camp management"],
  description: null,
  website: null,
  donateUrl: null,
  logoUrl: null,
  presence: [
    {
      countryCode: "KEN",
      country: "Kenya",
      region: null,
      areaCode: null,
      sectors: ["Food Security"],
      start: null,
      end: null,
      evidence,
    },
  ],
  size: null,
  evaluations: [],
  sources: [evidence],
});
const geography: MapGeography = {
  KEN: {
    name: "Kenya",
    coordinates: [5, 5],
    geometry: {
      type: "MultiPolygon",
      coordinates: [
        [
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ],
        ],
      ],
    },
    source: "Provider",
    url: evidence.url,
  },
};
const base: MapItem = {
  id: "food",
  country: "Kenya",
  location: "Kenya",
  coordinates: [5, 5],
  kind: "Hunger",
  severity: "Insufficient data",
  summary: "",
  source: {
    label: "IPC",
    url: evidence.url,
    published: "2026-10-30T00:00:00Z",
    reviewed: "2026-10-30T00:00:00Z",
  },
  dataset: "hapi-food",
  geographicPrecision: "Country centroid",
  reportingArea: {
    countryCode: "KEN",
    adminLevel: 0,
    admin1Code: null,
    admin2Code: null,
  },
  measurements: [{ metric: "ipc-3-plus", value: 12000 }],
};
const options = {
  organizations: [organization],
  selected: organization,
  topics: ["Hunger"],
  geography,
  datasets: defaultDatasets,
  period: "Latest" as const,
};

test("organization scope shows crisis measurements only in reported operating countries", () => {
  const outside = {
    ...base,
    id: "outside",
    reportingArea: { ...base.reportingArea!, countryCode: "UGA" },
  };
  const records = organizationCrisisRecords({
    ...options,
    records: [base, outside],
  });
  assert.equal(records.length, 1);
  assert.deepEqual(records[0].measurements, [
    { metric: "ipc-3-plus", value: 12000 },
  ]);
  assert.equal(records[0].source.url, evidence.url);
  assert.deepEqual(
    organizationCrisisRecords({
      ...options,
      selected: { ...organization, presence: [] },
      records: [base],
    }),
    [],
  );
});

test("Hunger and Camp management select separate named crisis measures without inventing camp populations", () => {
  const selection = organizationCrisisSelection(["Hunger", "Camp management"]);
  assert.deepEqual(
    new Set(selection.concerns),
    new Set(["hunger", "famine", "displacement", "refugees"]),
  );
  const displaced: MapItem = {
    ...base,
    id: "idps",
    kind: "Displacement",
    dataset: "hapi-idps",
    measurements: [{ metric: "idps", value: 700 }],
  };
  const records = organizationCrisisRecords({
    ...options,
    topics: ["Hunger", "Camp management"],
    records: [base, displaced],
  });
  assert.equal(records.length, 2);
  assert.equal(records[1].measurements![0].metric, "idps");
  assert.deepEqual(organizationCrisisSelection(["Education"]), {
    concerns: [],
    unsupported: ["Education"],
  });
});

test("multiple cause filters include matching organizations without changing unrelated filters", () => {
  const health = { ...organization, id: "health", topics: ["Health"] };
  const camp = { ...organization, id: "camp", topics: ["Camp management"] };
  assert.deepEqual(
    filterOrganizations([organization, health, camp], {
      ...defaultOrganizationFilters,
      topics: ["Hunger", "Camp management"],
    }).map((org) => org.id),
    ["org", "camp"],
  );
  assert.equal(
    filterOrganizations([organization, camp], {
      ...defaultOrganizationFilters,
      country: "Uganda",
      topics: ["Hunger", "Camp management"],
    }).length,
    0,
  );
});

test("located events use their actual coordinates for coverage rather than a guessed country name", () => {
  const event: MapItem = {
    ...base,
    id: "event",
    geographicPrecision: "Event location",
    reportingArea: undefined,
    country: "",
    kind: "Disaster response",
    dataset: "usgs",
    categoryIds: ["earthquake-response"],
    measurements: [],
  };
  const outside: MapItem = {
    ...event,
    id: "outside",
    country: "Kenya",
    coordinates: [20, 20],
  };
  assert.deepEqual(
    organizationCrisisRecords({
      ...options,
      topics: ["Disaster response"],
      records: [event, outside],
    }).map((item) => item.id),
    ["event"],
  );
});

test("coverage preserves polygon holes and antimeridian geography", () => {
  const hole = [
    [3, 3],
    [7, 3],
    [7, 7],
    [3, 7],
    [3, 3],
  ];
  const withHole = {
    ...geography.KEN.geometry,
    coordinates: [[geography.KEN.geometry.coordinates[0][0], hole]],
  };
  assert.equal(pointInArea([2, 2], withHole), true);
  assert.equal(pointInArea([5, 5], withHole), false);
  const dateline = {
    type: "MultiPolygon" as const,
    coordinates: [
      [
        [
          [170, -10],
          [-170, -10],
          [-170, 10],
          [170, 10],
          [170, -10],
        ],
      ],
    ],
  };
  assert.equal(pointInArea([179, 0], dateline), true);
  assert.equal(pointInArea([-179, 0], dateline), true);
  assert.equal(pointInArea([0, 0], dateline), false);
});

test("disabled datasets and closed observations do not silently reappear in organization maps", () => {
  assert.deepEqual(
    organizationCrisisRecords({
      ...options,
      records: [base],
      datasets: { ...defaultDatasets, "hapi-food": false },
    }),
    [],
  );
  assert.deepEqual(
    organizationCrisisRecords({
      ...options,
      records: [{ ...base, eventStatus: "Closed" }],
    }),
    [],
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  recordPrecision,
  recordUnit,
  recordValue,
} from "../app/lib/recordValues.ts";
import { defaultDatasets } from "../app/lib/dataSources.ts";
import type { MapItem } from "../app/lib/types.ts";

const item: MapItem = {
  id: "test",
  location: "Test",
  country: "Test",
  coordinates: [31, 48],
  kind: "Conflict",
  severity: "Insufficient data",
  summary: "",
  source: {
    label: "Test source",
    url: "https://example.org",
    published: null,
    reviewed: "2026-10-30T00:00:00Z",
  },
};

test("record values distinguish an observed zero from an unquantified report", () => {
  const measured = {
    ...item,
    measurements: [{ metric: "conflict-events" as const, value: 0 }],
  };
  assert.equal(recordValue(measured), 0);
  assert.equal(recordUnit(measured), "Reported events / month");
  assert.equal(recordValue(item), null);
  assert.equal(recordUnit(item), "Unquantified report");
});

test("table geography describes the reporting scope rather than adapter centroid coordinates", () => {
  assert.equal(
    recordPrecision({ ...item, geographicPrecision: "Event location" }),
    "Event location",
  );
  const country = {
    ...item,
    geographicPrecision: "Country centroid" as const,
    reportingArea: {
      countryCode: "TST",
      adminLevel: 0,
      admin1Code: null,
      admin2Code: null,
    },
  };
  assert.equal(recordPrecision(country), "Country report");
  assert.equal(
    recordPrecision({
      ...country,
      reportingArea: {
        ...country.reportingArea,
        adminLevel: 1,
        admin1Code: "TST1",
      },
    }),
    "Administrative area",
  );
});

test("live discovery excludes sandbox projects until explicitly selected", () => {
  assert.equal(defaultDatasets.catalogue, false);
  assert.equal(defaultDatasets["hapi-food"], true);
  assert.equal(defaultDatasets.usgs, true);
});

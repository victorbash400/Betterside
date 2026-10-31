import test from "node:test";
import assert from "node:assert/strict";
import { ucdpEvents } from "../app/lib/feeds/ucdp.ts";
import { ftsOrganizations } from "../app/lib/ftsOrganizations.ts";
import { overlayPoints } from "../app/lib/overlayData.ts";
import { overlayGeometry } from "../app/lib/overlayGeometry.ts";
import { defaultOverlaySettings } from "../app/lib/concerns.ts";
import type { Country } from "../app/lib/feeds/shared.ts";
const countries: Country[] = [
  {
    id: 1,
    iso3: "KEN",
    name: "Kenya",
    centroid: { type: "Point", coordinates: [38, 1] },
    is_deprecated: false,
    record_type: 1,
  },
];
const event = {
  id: "1",
  type_of_violence: "1",
  conflict_name: "Reported conflict",
  dyad_name: "Actor A - Actor B",
  where_prec: "1",
  where_coordinates: "Reported town",
  adm_1: "Province",
  adm_2: "District",
  latitude: "0.25",
  longitude: "35.5",
  country: "Kenya",
  date_start: "2026-09-01 00:00:00.000",
  date_end: "2026-09-01 00:00:00.000",
  best: "2",
  low: "1",
  high: "3",
};
const feed = {
  source: "https://ucdp.uu.se/downloads/candidateged/test.csv",
  index: "https://ucdp.uu.se/downloads/",
  version: "26.0.9",
  retrievedAt: "2026-10-31T00:00:00Z",
  data: [event],
};
test("UCDP retains provider coordinates and uncertainty without claiming aggregate locations are exact", () => {
  const result = ucdpEvents(
    {
      ...feed,
      data: [
        event,
        { ...event, id: "2", where_prec: "2" },
        { ...event, id: "3", where_prec: "3" },
      ],
    },
    countries,
  );
  assert.equal(result.skipped, 0);
  assert.equal(result.issues.length, 3);
  assert.deepEqual(result.issues[0].coordinates, [35.5, 0.25]);
  assert.equal(result.issues[1].locationPrecision?.uncertaintyKm, 25);
  assert.deepEqual(result.issues[2].coordinates, [35.5, 0.25]);
  assert.equal(result.issues[2].geographicPrecision, "Administrative area");
  assert.equal(result.issues[0].source.published, null);
  assert.equal(result.issues[0].measurements?.[0].metric, "conflict-incidents");
});
test("UCDP rejects invalid positions and dates while withholding inconsistent fatality measurements", () => {
  const result = ucdpEvents(
    {
      ...feed,
      data: [
        { ...event, latitude: "" },
        { ...event, id: "2", best: "50" },
        { ...event, id: "3", date_end: "2026-08-01" },
      ],
    },
    countries,
  );
  assert.equal(result.issues.length, 1);
  assert.equal(result.skipped, 2);
  assert.equal(result.warnings, 1);
  assert.equal(result.issues[0].measurements?.length, 1);
});
test("unlocated events remain separate from summaries and retain all event dates", () => {
  const result = ucdpEvents(
    {
      ...feed,
      data: [
        event,
        { ...event, id: "2", where_prec: "6" },
        {
          ...event,
          id: "3",
          where_prec: "6",
          date_start: "2026-09-15",
          date_end: "2026-09-15",
        },
      ],
    },
    countries,
  );
  const points = overlayPoints(result.issues, {
    concerns: ["war"],
    scale: "Linear",
  });
  const precise = points.find(
    (point) => point.records[0].geographicPrecision === "Event location",
  )!;
  const unlocated = points.find(
    (point) => point.records[0].geographicPrecision === "Country centroid",
  )!;
  assert.equal(precise.value, 1);
  assert.equal(precise.weight, 1);
  assert.equal(unlocated.value, 2);
  assert.equal(unlocated.period?.start, "2026-09-01T00:00:00.000Z");
  assert.equal(unlocated.period?.end, "2026-09-15T00:00:00.000Z");
  const geometry = overlayGeometry(points, {
    ...defaultOverlaySettings,
    mode: "Heatmap",
  });
  assert.equal(
    geometry.markers.features.filter((feature) => feature.properties?.located)
      .length,
    1,
  );
  assert.equal(
    geometry.markers.features.filter((feature) => !feature.properties?.located)
      .length,
    1,
  );
});
test("FTS directory adds source IDs and directory locations without inventing operating areas, causes or donation recipients", () => {
  const [org] = ftsOrganizations(
    {
      status: "ok",
      data: [
        {
          id: 123,
          name: "Reported organization",
          abbreviation: "ORG",
          categories: [{ name: "NGOs", group: "organizationType" }],
          locations: [{ name: "Kenya", pcode: "KE", adminLevel: 0 }],
        },
      ],
    },
    "2026-10-31T00:00:00Z",
  );
  assert.equal(org.id, "fts:123");
  assert.equal(org.presence.length, 0);
  assert.equal(org.topics.length, 0);
  assert.equal(org.donateUrl, null);
  assert.equal(org.directoryLocations?.[0].name, "Kenya");
  assert.equal(org.identifiers[0].scheme, "OCHA FTS");
});

test("regional UCDP reporting anchors remain separate instead of collapsing into a national point", () => {
  const result = ucdpEvents(
    {
      ...feed,
      data: [
        { ...event, where_prec: "3" },
        { ...event, id: "2", where_prec: "4", longitude: "36" },
        { ...event, id: "3", where_prec: "6" },
      ],
    },
    countries,
  );
  const points = overlayPoints(result.issues, {
    concerns: ["war"],
    scale: "Linear",
  });
  assert.equal(points.length, 3);
  assert.equal(
    points.filter(
      (point) => point.records[0].geographicPrecision === "Administrative area",
    ).length,
    2,
  );
  assert.ok(points.some((point) => point.coordinates[0] === 35.5));
  assert.ok(points.some((point) => point.coordinates[0] === 36));
});

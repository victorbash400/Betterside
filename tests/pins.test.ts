import test from "node:test";
import assert from "node:assert/strict";
import { matchesPin, pinCountries } from "../app/lib/pins.ts";
import {
  trackingSchema,
  emptyTracking,
  type Interest,
} from "../app/lib/tracking.ts";
import type { MapItem } from "../app/lib/types.ts";

const record: MapItem = {
  id: "water-ke",
  location: "Nairobi",
  country: "Kenya",
  coordinates: [36.8, -1.3],
  kind: "Water",
  severity: "Insufficient data",
  summary: "",
  source: {
    label: "Source",
    url: "https://example.com",
    published: null,
    reviewed: "2026-11-03",
  },
  reportingArea: {
    countryCode: "KEN",
    adminLevel: 0,
    admin1Code: null,
    admin2Code: null,
  },
};
function pin(target?: Interest["target"]): Interest {
  return { id: "pin", name: "Saved", target, issueIds: [], hiddenKinds: [] };
}
test("country pins use stable codes across names and never absorb another coded country", () => {
  const saved = pin({ kind: "country", country: "Kenya", countryCode: "KEN" });
  assert.equal(matchesPin(record, saved), true);
  assert.equal(
    matchesPin({ ...record, country: "Renamed Kenya" }, saved),
    true,
  );
  assert.equal(
    matchesPin(
      {
        ...record,
        reportingArea: { ...record.reportingArea!, countryCode: "UGA" },
      },
      saved,
    ),
    false,
  );
  assert.equal(
    matchesPin({ ...record, reportingArea: undefined }, saved),
    true,
  );
});
test("country choices deduplicate codes and exclude unstructured multi-country strings", () => {
  assert.deepEqual(
    pinCountries([
      record,
      { ...record, id: "alternate", country: "Another label" },
      {
        ...record,
        id: "regional",
        country: "Kenya, Uganda",
        reportingArea: undefined,
      },
    ]),
    [{ country: "Kenya", countryCode: "KEN" }],
  );
});
test("cause pins resolve current matching records without manually saving their IDs", () => {
  const saved = pin({ kind: "cause", concern: "water" });
  assert.equal(matchesPin(record, saved), true);
  assert.equal(matchesPin({ ...record, id: "new-record" }, saved), true);
  assert.equal(matchesPin({ ...record, kind: "Conflict" }, saved), false);
});
test("legacy folders keep explicit membership", () => {
  const saved = { ...pin(), issueIds: [record.id] };
  assert.equal(matchesPin(record, saved), true);
  assert.equal(matchesPin({ ...record, id: "other" }, saved), false);
});
test("tracking round-trips pin targets and accepts existing snapshots", () => {
  assert.deepEqual(trackingSchema.parse(emptyTracking), emptyTracking);
  const interests = [
    pin({ kind: "country", country: "Kenya", countryCode: "KEN" }),
    { ...pin({ kind: "cause", concern: "water" }), id: "cause" },
  ];
  assert.deepEqual(
    trackingSchema.parse({ ...emptyTracking, interests }).interests,
    interests,
  );
  assert.equal(
    trackingSchema.safeParse({
      ...emptyTracking,
      interests: [pin({ kind: "cause", concern: "invalid" } as never)],
    }).success,
    false,
  );
});

test("country-cause scopes are intersections and organization pins do not impersonate records", () => {
  const saved = pin({
    kind: "scope",
    country: "Kenya",
    countryCode: "KEN",
    concern: "water",
  });
  assert.equal(matchesPin(record, saved), true);
  assert.equal(matchesPin({ ...record, kind: "Conflict" }, saved), false);
  assert.equal(
    matchesPin(
      {
        ...record,
        reportingArea: { ...record.reportingArea!, countryCode: "PAK" },
      },
      saved,
    ),
    false,
  );
  assert.equal(
    matchesPin(record, pin({ kind: "organization", organizationId: "org-a" })),
    false,
  );
  assert.equal(
    trackingSchema.safeParse({ ...emptyTracking, interests: [saved] }).success,
    true,
  );
});

test("country filters use the same coded geography as scoped pins", async () => {
  const { matchesDiscoveryFilters } =
    await import("../app/lib/discoveryFilters.ts");
  const filters = {
    country: "Kenya",
    countryCode: "KEN",
    recordType: "",
    precision: "",
  };
  assert.equal(
    matchesDiscoveryFilters(
      { ...record, country: "Alternate country label" },
      filters,
    ),
    true,
  );
  assert.equal(
    matchesDiscoveryFilters(
      {
        ...record,
        reportingArea: { ...record.reportingArea!, countryCode: "UGA" },
      },
      filters,
    ),
    false,
  );
});

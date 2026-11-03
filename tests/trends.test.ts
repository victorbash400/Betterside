import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTrendSeries,
  comparableTrendSeries,
  trendScopeSchema,
  trendDatasets,
} from "../app/lib/trends.ts";
import { hapiIndicators } from "../app/lib/feeds/hapi.ts";
import { samePinTarget, pinTrendScope } from "../app/lib/pins.ts";
import { createAsyncCache } from "../app/lib/asyncCache.ts";
const countries = [
  {
    id: 1,
    iso3: "PAK",
    name: "Pakistan",
    centroid: {
      type: "Point" as const,
      coordinates: [70, 30] as [number, number],
    },
    is_deprecated: false,
    record_type: 1,
  },
];
const resources = [
  {
    resource_hdx_id: "source",
    hdx_link: "https://example.com/data",
    dataset_hdx_provider_name: "IPC",
    update_date: "2026-11-03T00:00:00Z",
  },
];
const base = {
  resource_hdx_id: "source",
  location_code: "PAK",
  location_name: "Pakistan",
  admin_level: 0,
  admin1_code: null,
  admin1_name: null,
  admin2_code: null,
  admin2_name: null,
  reference_period_start: "2026-01-01T00:00:00",
  reference_period_end: "2026-03-31T00:00:00",
  ipc_phase: "3+",
  ipc_type: "current",
  population_in_phase: 100,
};
function history(rows: unknown[]) {
  return hapiIndicators(
    "hapi-food",
    { data: rows },
    countries,
    resources,
    "2026-11-03T00:00:00Z",
    true,
  ).issues;
}
test("map remains latest-only while history retains dated zero-valued observations", () => {
  const rows = [
    base,
    {
      ...base,
      reference_period_start: "2026-06-01T00:00:00",
      reference_period_end: "2026-08-31T00:00:00",
      population_in_phase: 0,
    },
  ];
  assert.equal(
    hapiIndicators(
      "hapi-food",
      { data: rows },
      countries,
      resources,
      "2026-11-03T00:00:00Z",
    ).issues.length,
    1,
  );
  const items = history(rows);
  assert.equal(items.length, 2);
  assert.equal(items[0].id, items[1].id);
  const result = buildTrendSeries(items, "hunger");
  assert.equal(result.length, 1);
  assert.deepEqual(
    result[0].points.map((point) => point.value),
    [100, 0],
  );
  assert.equal(result[0].points[0].date, "2026-01-01T00:00:00.000Z");
});
test("history rejects projections and does not fill missing periods or merge different populations", () => {
  const records = history([
    base,
    { ...base, ipc_type: "first projection", population_in_phase: 500 },
  ]);
  const result = buildTrendSeries(records, "hunger");
  assert.equal(result[0].points.length, 1);
  assert.deepEqual(comparableTrendSeries(result, "ipc-3-plus"), []);
  const different = buildTrendSeries(
    [
      records[0],
      { ...records[0], id: "other-population", location: "Other population" },
    ],
    "hunger",
  );
  assert.equal(different.length, 2);
});
test("sources, units and revisions remain explicit and dated", () => {
  const item = history([base])[0];
  const points = buildTrendSeries([
    item,
    {
      ...item,
      measurements: [{ metric: "ipc-3-plus", value: 0 }],
      source: { ...item.source, published: "2026-11-04T00:00:00Z" },
    },
    { ...item, source: { ...item.source, label: "Other source" } },
  ]);
  assert.equal(points.length, 2);
  assert.equal(points[0].points.length, 1);
  assert.equal(points[0].points[0].value, 0);
  assert.equal(points[0].points[0].source.url, item.source.url);
  assert.equal(points[0].unit, "People in IPC/CH Phase 3+");
});
test("trend scope is bounded and compatible datasets are chosen explicitly", () => {
  assert.equal(
    trendScopeSchema.safeParse({ countries: ["PAK"], concern: "hunger" })
      .success,
    true,
  );
  assert.equal(
    trendScopeSchema.safeParse({ countries: ["pak"] }).success,
    false,
  );
  assert.equal(
    trendScopeSchema.safeParse({
      countries: ["PAK", "KEN", "USA", "UGA", "TZA"],
    }).success,
    false,
  );
  assert.deepEqual(trendDatasets({ countries: ["PAK"], concern: "hunger" }), [
    "hapi-food",
  ]);
  assert.deepEqual(
    trendDatasets({ countries: ["PAK"], concern: "disease" }),
    [],
  );
});
test("pin identity distinguishes scope, country and organization and restores comparison scope", () => {
  const scope = {
    kind: "scope" as const,
    countryCode: "PAK",
    country: "Pakistan",
    concern: "hunger" as const,
  };
  assert.equal(
    samePinTarget(scope, { ...scope, country: "Changed display name" }),
    true,
  );
  assert.equal(samePinTarget(scope, { ...scope, concern: "famine" }), false);
  assert.equal(
    samePinTarget(scope, {
      kind: "country",
      country: "Pakistan",
      countryCode: "PAK",
    }),
    false,
  );
  assert.equal(
    samePinTarget(
      { kind: "organization", organizationId: "a" },
      { kind: "organization", organizationId: "a" },
    ),
    true,
  );
  assert.deepEqual(
    pinTrendScope(
      {
        id: "saved",
        name: "Hunger in Pakistan",
        target: scope,
        issueIds: [],
        hiddenKinds: [],
      },
      [],
    ),
    { countries: ["PAK"], concern: "hunger" },
  );
});
test("cache invalidation reloads only the requested scope", async () => {
  const cache = createAsyncCache<number>({ maxEntries: 4, maxBytes: 1000 });
  const policy = { ttlMs: 10000, errorTtlMs: 0 };
  let calls = 0;
  await cache.get("a", async () => ++calls, policy);
  await cache.get("b", async () => ++calls, policy);
  cache.invalidate("a");
  assert.equal((await cache.get("b", async () => ++calls, policy)).value, 2);
  assert.equal((await cache.get("a", async () => ++calls, policy)).value, 3);
});

test("ambiguous historical revisions fail instead of fabricating a trend", () => {
  assert.throws(
    () => history([base, { ...base, population_in_phase: 200 }]),
    (error: Error) =>
      error.message.includes("Conflicting historical measurements"),
  );
});

test("scoped organization identities do not collide with global pins", () => {
  const global = { kind: "organization" as const, organizationId: "org-a" };
  assert.equal(
    samePinTarget(global, {
      ...global,
      countryCode: "PAK",
      country: "Pakistan",
    }),
    false,
  );
  assert.equal(
    samePinTarget(
      { ...global, countryCode: "PAK" },
      { ...global, countryCode: "PAK", country: "Pakistan" },
    ),
    true,
  );
});

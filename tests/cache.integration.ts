import test from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { sourceTtl, cacheLifetimes } from "../app/lib/feedCachePolicy.ts";

test("discovery routes share provider requests, isolate organization lookups, and expire only due feeds", async () => {
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  const originalIdentifier = process.env.HDX_HAPI_APP_IDENTIFIER;
  let time = originalNow();
  Date.now = () => time;
  process.env.HDX_HAPI_APP_IDENTIFIER = "cache-integration-test";
  const calls = new Map<string, number>();
  const country = {
    id: 1,
    iso3: "TST",
    name: "Test country",
    centroid: { type: "Point", coordinates: [10, 20] },
    is_deprecated: false,
    record_type: 1,
  };
  const resource = {
    resource_hdx_id: "test-resource",
    hdx_link: "https://data.humdata.org/dataset/cache-test",
    dataset_hdx_provider_name: "Test provider",
    update_date: "2026-10-28T00:00:00Z",
  };
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    const key = url.hostname + url.pathname;
    calls.set(key, (calls.get(key) ?? 0) + 1);
    if (url.hostname === "www.gdacs.org")
      throw new Error("Test upstream failure");
    if (url.hostname === "earthquake.usgs.gov")
      return Response.json({
        features: [
          {
            id: "test-event",
            geometry: { type: "Point", coordinates: [10, 20, 5] },
            properties: {
              title: "Test earthquake",
              time: 1793145600000,
              updated: 1793145600000,
              url: "https://earthquake.usgs.gov/earthquakes/eventpage/test-event",
              alert: null,
              ids: ",test-event,",
              type: "earthquake",
            },
          },
        ],
      });
    if (url.hostname === "eonet.gsfc.nasa.gov")
      return Response.json({ events: [] });
    if (url.pathname === "/api/v2/country/")
      return Response.json({ results: [country], next: null });
    if (url.pathname === "/api/v2/event/")
      return Response.json({ results: [], next: null });
    if (url.pathname.endsWith("metadata/resource"))
      return Response.json({ data: [resource] });
    if (url.pathname.endsWith("operational-presence")) {
      const code = url.searchParams.get("location_code")!;
      const sector = url.searchParams.get("sector_code") ?? "PRO";
      return Response.json({
        data: [
          {
            location_code: code,
            location_name: code,
            admin1_code: null,
            admin1_name: null,
            admin2_code: null,
            admin2_name: null,
            admin_level: 0,
            resource_hdx_id: resource.resource_hdx_id,
            org_acronym: "TEST",
            org_name: `Test organization ${code}`,
            org_type_description: "NGO",
            sector_code: sector,
            sector_name: sector === "PRO" ? "Protection" : "Health",
            reference_period_start: "2026-10-01T00:00:00Z",
            reference_period_end: null,
          },
        ],
      });
    }
    if (url.hostname === "hapi.humdata.org") return Response.json({ data: [] });
    throw new Error(`Unexpected test URL: ${url.hostname}${url.pathname}`);
  };
  try {
    const { GET: discovery } = await import("../app/api/events/route.ts");
    const request = () => new Request("http://localhost/api/events");
    const responses = await Promise.all(
      Array.from({ length: 12 }, () => discovery(request())),
    );
    const snapshots = await Promise.all(
      responses.map((response) => response.json()),
    );
    assert.ok(
      snapshots.every(
        (snapshot) =>
          snapshot.issues.filter(
            (item: { dataset: string }) => item.dataset === "usgs",
          ).length === 1,
      ),
    );
    assert.ok(
      snapshots.every(
        (snapshot) => snapshot.issues.length === snapshots[0].issues.length,
      ),
    );
    assert.ok(
      snapshots.every(
        (snapshot) =>
          JSON.stringify(snapshot.sources) ===
          JSON.stringify(snapshots[0].sources),
      ),
    );
    assert.equal(calls.get("goadmin.ifrc.org/api/v2/country/"), 1);
    assert.equal(calls.get("hapi.humdata.org/api/v2/metadata/resource"), 1);
    assert.equal(
      calls.get(
        "earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson",
      ),
      1,
    );
    assert.equal(
      calls.get("hapi.humdata.org/api/v2/coordination-context/conflict-events"),
      2,
    );
    assert.equal(
      calls.get("www.gdacs.org/gdacsapi/api/Events/geteventlist/search"),
      1,
    );
    const initialCounts = new Map(calls);
    const etag = responses[0].headers.get("etag")!;
    const repeated = await discovery(request());
    assert.equal(repeated.headers.get("etag"), etag);
    const conditional = await discovery(
      new Request("http://localhost/api/events", {
        headers: { "If-None-Match": etag },
      }),
    );
    assert.equal(conditional.status, 304);
    assert.equal(await conditional.text(), "");
    assert.deepEqual(calls, initialCounts);
    time += cacheLifetimes.failure;
    const recovered = await (await discovery(request())).json();
    assert.equal(
      calls.get("www.gdacs.org/gdacsapi/api/Events/geteventlist/search"),
      2,
    );
    for (const [key, count] of initialCounts)
      if (!key.startsWith("www.gdacs.org"))
        assert.equal(calls.get(key), count, key);
    assert.deepEqual(
      recovered.sources.find((source: { id: string }) => source.id === "usgs"),
      snapshots[0].sources.find(
        (source: { id: string }) => source.id === "usgs",
      ),
    );
    time += sourceTtl.usgs - cacheLifetimes.failure;
    await discovery(request());
    assert.equal(
      calls.get(
        "earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson",
      ),
      2,
    );
    assert.equal(calls.get("hapi.humdata.org/api/v2/metadata/resource"), 1);
    const { GET: organizations } =
      await import("../app/api/organizations/route.ts");
    const orgRequest = (code = "TST", concern = "war") =>
      new Request(
        `http://localhost/api/organizations?country=${code}&concern=${concern}`,
      );
    const orgResponses = await Promise.all(
      Array.from({ length: 8 }, () => organizations(orgRequest())),
    );
    const orgData = await orgResponses[0].json();
    assert.equal(orgData.organizations[0].name, "Test organization TST");
    const orgKey =
      "hapi.humdata.org/api/v2/coordination-context/operational-presence";
    assert.equal(calls.get(orgKey), 1);
    const orgConditional = await organizations(
      new Request(orgRequest().url, {
        headers: { "If-None-Match": orgResponses[0].headers.get("etag")! },
      }),
    );
    assert.equal(orgConditional.status, 304);
    const other = await (await organizations(orgRequest("AAA"))).json();
    assert.equal(other.organizations[0].name, "Test organization AAA");
    await organizations(orgRequest("TST", "health"));
    assert.equal(calls.get(orgKey), 3);
    assert.equal(calls.get("hapi.humdata.org/api/v2/metadata/resource"), 1);
    const workingFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) =>
      new URL(String(input)).hostname === "earthquake.usgs.gov"
        ? new Response(null, { status: 503 })
        : workingFetch(input, init);
    time += sourceTtl.usgs;
    const staleResponse = await discovery(request());
    const staleData = await staleResponse.json();
    const staleSource = staleData.sources.find(
      (source: { id: string }) => source.id === "usgs",
    );
    assert.equal(staleResponse.status, 200);
    assert.equal(staleSource.state, "stale");
    assert.equal(staleSource.count, 1);
    assert.ok(
      staleData.issues.some(
        (item: { dataset: string }) => item.dataset === "usgs",
      ),
    );
    assert.ok(staleSource.message.includes("HTTP 503"));
  } finally {
    globalThis.fetch = originalFetch;
    Date.now = originalNow;
    if (originalIdentifier === undefined)
      delete process.env.HDX_HAPI_APP_IDENTIFIER;
    else process.env.HDX_HAPI_APP_IDENTIFIER = originalIdentifier;
  }
});

test("map remounts share one validated boundary request until geography expiry", async () => {
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  let time = originalNow();
  let calls = 0;
  Date.now = () => time;
  const data = JSON.parse(
    readFileSync(
      new URL("../public/geography/areas.json", import.meta.url),
      "utf8",
    ),
  );
  globalThis.fetch = async (input) => {
    assert.equal(input, "/geography/areas.json");
    calls++;
    return Response.json(data);
  };
  try {
    const { loadMapGeography } =
      await import("../app/state/mapGeographyCache.ts");
    const consumers = await Promise.all(
      Array.from({ length: 10 }, () => loadMapGeography()),
    );
    assert.equal(calls, 1);
    assert.ok(consumers.every((value) => value === consumers[0]));
    await loadMapGeography();
    assert.equal(calls, 1);
    time += cacheLifetimes.geography;
    const refreshed = await loadMapGeography();
    assert.equal(calls, 2);
    assert.deepEqual(refreshed, consumers[0]);
  } finally {
    globalThis.fetch = originalFetch;
    Date.now = originalNow;
  }
});

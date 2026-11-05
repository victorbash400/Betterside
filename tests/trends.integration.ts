import test from "node:test";
import assert from "node:assert/strict";

test("history routes coalesce country/source requests and preserve dated measurements", async () => {
  const originalFetch = globalThis.fetch,
    originalIdentifier = process.env.HDX_HAPI_APP_IDENTIFIER;
  process.env.HDX_HAPI_APP_IDENTIFIER = "history-integration-test";
  const calls = new Map<string, number>();
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    calls.set(url.pathname, (calls.get(url.pathname) ?? 0) + 1);
    if (url.pathname === "/api/v2/country/")
      return Response.json({
        results: [
          {
            id: 1,
            iso3: "PAK",
            name: "Pakistan",
            centroid: { type: "Point", coordinates: [70, 30] },
            is_deprecated: false,
            record_type: 1,
          },
        ],
        next: null,
      });
    if (url.pathname.endsWith("metadata/resource"))
      return Response.json({
        data: [
          {
            resource_hdx_id: "history-resource",
            hdx_link: "https://example.org/history",
            dataset_hdx_provider_name: "IPC",
            update_date: "2026-11-03T00:00:00Z",
          },
        ],
      });
    if (url.pathname.endsWith("food-security")) {
      assert.equal(url.searchParams.get("location_code"), "PAK");
      assert.equal(url.searchParams.get("ipc_type"), "current");
      const base = {
        resource_hdx_id: "history-resource",
        location_code: "PAK",
        location_name: "Pakistan",
        admin_level: 0,
        admin1_code: null,
        admin1_name: null,
        admin2_code: null,
        admin2_name: null,
        reference_period_start: "2024-01-01T00:00:00",
        reference_period_end: "2024-12-31T00:00:00",
        ipc_type: "current",
        ipc_phase: "3+",
        population_in_phase: 100,
      };
      return Response.json({
        data: [
          base,
          {
            ...base,
            reference_period_start: "2025-01-01T00:00:00",
            reference_period_end: "2025-12-31T00:00:00",
            population_in_phase: 0,
          },
        ],
      });
    }
    throw new Error(`Unexpected history URL: ${url.pathname}`);
  };
  try {
    const { GET } = await import("../app/api/trends/route.ts");
    const request = () =>
      new Request("http://localhost/api/trends?countries=PAK&concern=hunger");
    const responses = await Promise.all(
      Array.from({ length: 8 }, () => GET(request())),
    );
    assert.ok(responses.every((response) => response.status === 200));
    const result = await responses[0].json();
    assert.equal(result.series.length, 1);
    assert.deepEqual(
      result.series[0].points.map((point: { value: number }) => point.value),
      [100, 0],
    );
    assert.ok([...calls.values()].every((count) => count === 1));
    const initial = new Map(calls);
    const { showTrendsTool } = await import("../app/tools/show-trends.ts");
    const output = await showTrendsTool({ donor: "history-test", records: [], origin: "http://localhost" }).execute!(
      { scopes: [{ countries: ["PAK"], concern: "hunger" }], view: "Compare data", offset: 0 },
      { toolCallId: "history-tool", messages: [], context: {} },
    ) as { kind: string; view: string; total: number; series: unknown[]; summaries: Array<{ highest: { date: string; value: number }; latest: { date: string; value: number } }> };
    assert.equal(output.kind, "trends");
    assert.equal(output.view, "Compare data");
    assert.equal(output.total, 1);
    assert.deepEqual(output.series, result.series);
    assert.deepEqual(output.summaries[0].highest, { date: "2024-01-01T00:00:00.000Z", value: 100 });
    assert.deepEqual(output.summaries[0].latest, { date: "2025-01-01T00:00:00.000Z", value: 0 });
    assert.deepEqual(calls, initial);
    const conditional = await GET(
      new Request(request().url, {
        headers: { "If-None-Match": responses[0].headers.get("etag")! },
      }),
    );
    assert.equal(conditional.status, 304);
    assert.deepEqual(calls, initial);
    assert.equal(
      (await GET(new Request("http://localhost/api/trends?countries=invalid")))
        .status,
      400,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalIdentifier === undefined)
      delete process.env.HDX_HAPI_APP_IDENTIFIER;
    else process.env.HDX_HAPI_APP_IDENTIFIER = originalIdentifier;
  }
});

test("provider rate limits are cached without retrying on navigation", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(null, {
      status: 429,
      headers: { "Retry-After": "120" },
    });
  };
  try {
    const { feedJson } = await import("../app/server/feeds/request.ts");
    const url = "https://example.org/history-rate-limit";
    await assert.rejects(feedJson(url), (error: Error) =>
      error.message.includes("rate limited"),
    );
    await assert.rejects(feedJson(url), (error: Error) =>
      error.message.includes("rate limited"),
    );
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

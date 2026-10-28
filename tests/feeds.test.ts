import test from "node:test";
import assert from "node:assert/strict";
import { hapiIndicators, type HapiDataset } from "../app/lib/feeds/hapi.ts";
import { usgsEvents } from "../app/lib/feeds/usgs.ts";
import { deduplicateRecords } from "../app/lib/feeds/deduplicate.ts";
import { sourceUrlIdentity, feedDate } from "../app/lib/feeds/shared.ts";
import { trackingSchema } from "../app/lib/tracking.ts";
import { searchRecords } from "../app/lib/researchRecords.ts";
import { formatDate } from "../app/lib/dates.ts";
import type { MapItem } from "../app/lib/types.ts";
const reviewed = "2026-10-28T00:00:00Z";
const countries = [{ id: 1, iso3: "TST", name: "Test country", centroid: { type: "Point" as const, coordinates: [10, 20] as [number, number] }, is_deprecated: false, record_type: 1 }];
const resources = [{ resource_hdx_id: "resource", hdx_link: "https://data.humdata.org/dataset/test/resource/resource", dataset_hdx_provider_name: "Test provider", update_date: "2026-10-28T00:00:00Z" }];
const base = { resource_hdx_id: "resource", location_code: "TST", location_name: "Test country", admin_level: 0, admin1_code: null, admin1_name: null, admin2_code: null, admin2_name: null, reference_period_start: "2026-10-01T00:00:00", reference_period_end: "2026-10-31T23:59:59" };
function indicators(dataset: HapiDataset, rows: unknown[]) {
  return hapiIndicators(dataset, { data: rows }, countries, resources, reviewed);
}
test("HAPI keeps latest sector indicators, rejects disaggregated totals, preserves latest zero", () => {
  const row = { ...base, sector_code: "WSH", sector_name: "Water", category: "", population_status: "INN", population: 100 };
  const result = indicators("hapi-needs", [row, { ...row, reference_period_start: "2026-10-20T00:00:00", population: 0 }, { ...row, category: "female", population: 80 }]);
  assert.equal(result.issues.length, 1);
  assert.ok(result.issues[0].summary.startsWith("0 people"));
  assert.equal(result.issues[0].kind, "Water");
  assert.equal(result.issues[0].geographicPrecision, "Country centroid");
  assert.equal(result.issues[0].project, undefined);
  assert.equal(result.issues[0].source.published, resources[0].update_date);
  assert.notEqual(result.issues[0].referencePeriod?.start, result.issues[0].source.published);
});
test("IPC combined phase is never added to phases or projections", () => {
  const row = { ...base, ipc_phase: "3+", ipc_type: "current", population_in_phase: 100 };
  const result = indicators("hapi-food", [row, { ...row, ipc_phase: "3" }, { ...row, ipc_type: "first projection" }]);
  assert.equal(result.issues.length, 1);
  assert.ok(result.issues[0].summary.startsWith("100 people"));
  assert.equal(result.issues[0].severity, "Insufficient data");
});
test("conflict categories and displacement operations stay separate", () => {
  const conflict = { ...base, event_type: "political_violence", events: 4, fatalities: 1 };
  assert.equal(indicators("hapi-conflict", [conflict, { ...conflict, event_type: "civilian_targeting" }]).issues.length, 2);
  const idp = { ...base, operation: "Operation A", assessment_type: "BA", reporting_round: 1, population: 100 };
  const items = indicators("hapi-idps", [idp, { ...idp, operation: "Operation B" }, { ...idp, assessment_type: "ETT" }]).issues;
  assert.equal(items.length, 3);
  assert.equal(new Set(items.map((item) => item.id)).size, 3);
});
test("refugee origin and host dimensions remain distinct and have stable compact IDs", () => {
  const row = { ...base, population_group: "REF", gender: "all", age_range: "all", origin_location_code: "AAA", origin_location_name: "Origin", asylum_location_code: "TST", asylum_location_name: "Host", population: 100 };
  const result = indicators("hapi-refugees", [row, { ...row, origin_location_code: "BBB" }, { ...row, gender: "f" }]);
  assert.equal(result.issues.length, 2);
  assert.ok(result.issues.every((item) => item.id.length < 160));
});
test("rainfall versions are explicit and never converted into disaster severity", () => {
  const row = { ...base, admin_level: 1, admin1_code: "TST1", admin1_name: "Region", aggregation_period: "dekad", version: "final", rainfall: 5, rainfall_long_term_average: 10, rainfall_anomaly_pct: 50, provider_admin1_code: "1", provider_admin2_code: null };
  const result = indicators("hapi-rainfall", [row, { ...row, version: "forecast" }]);
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].severity, "Insufficient data");
  assert.equal(result.issues[0].country, "Test country");
});
test("reported response funding and risk remain indicators, never payment projects", () => {
  const funding = indicators("hapi-funding", [{ ...base, appeal_code: "TEST26", appeal_name: "Response", requirements_usd: 1000, funding_usd: 200, funding_pct: 20 }]).issues[0];
  const risk = indicators("hapi-risk", [{ ...base, risk_class: "High", global_rank: 4, overall_risk: 7, meta_missing_indicators_pct: 5 }]).issues[0];
  assert.equal(funding.project, undefined);
  assert.equal(risk.project, undefined);
  assert.equal(funding.recordType, "Indicator");
  assert.equal(risk.severity, "Insufficient data");
  assert.ok(funding.summary.includes("USD 200"));
  assert.ok(risk.summary.includes("7/10"));
});
test("unknown geography or source metadata is counted, never positioned at zero", () => {
  const row = { ...base, ipc_phase: "3+", ipc_type: "current", population_in_phase: 100 };
  const result = indicators("hapi-food", [{ ...row, location_code: "UNKNOWN" }, { ...row, resource_hdx_id: "missing" }]);
  assert.equal(result.skipped, 2);
  assert.deepEqual(result.issues, []);
  assert.throws(() => indicators("hapi-food", [{ ...row, population_in_phase: "100" }]));
});
function item(id: string, identities: string[] = []): MapItem {
  return { id, location: "Same location", country: "Test country", coordinates: [10, 20], kind: "Disaster response", severity: "Insufficient data", summary: "", source: { label: id, url: `https://example.org/${id}`, published: reviewed, reviewed }, identities, dataset: "usgs" };
}
test("only exact provider identities merge; same names, dates and coordinates never do", () => {
  assert.equal(deduplicateRecords([item("a"), item("b")]).length, 2);
  const merged = deduplicateRecords([item("a", ["usgs:1"]), item("b", ["usgs:1"])]);
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0].aliases, ["b"]);
  assert.equal(merged[0].relatedSources?.length, 1);
});
test("transitive provider identities merge without losing evidence", () => {
  const merged = deduplicateRecords([item("a", ["x"]), item("b", ["y"]), item("c", ["x", "y"])]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].relatedSources?.length, 2);
  assert.equal(merged[0].aliases?.length, 2);
});
test("a repeated primary record does not discard merged aliases or sources", () => {
  const merged = deduplicateRecords([item("a", ["x"]), item("b", ["x"]), item("a", ["x"])]);
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0].aliases, ["b"]);
  assert.equal(merged[0].relatedSources?.length, 1);
});
test("documented source links establish cross-source IDs across episodes", () => {
  assert.equal(sourceUrlIdentity("http://www.gdacs.org/report.aspx?eventtype=TC&eventid=123&episodeid=2"), "gdacs:TC:123");
  assert.equal(sourceUrlIdentity("https://earthquake.usgs.gov/earthquakes/eventpage/us123/executive"), "usgs:us123");
});
test("new sources and their provenance survive tracking round trips", () => {
  const records = indicators("hapi-food", [{ ...base, ipc_phase: "3+", ipc_type: "current", population_in_phase: 100 }]).issues;
  const saved = trackingSchema.parse({ version: 1, following: records.map((item) => item.id), savedItems: records, interests: [] });
  assert.deepEqual(saved.savedItems, records);
});
test("research search is bounded, paginated and source-scoped", () => {
  const records = Array.from({ length: 45 }, (_, index) => item(String(index)));
  const first = searchRecords(records, { country: "Test", query: "same location", dataset: "usgs" });
  assert.equal(first.total, 45); assert.equal(first.records.length, 20); assert.equal(first.nextOffset, 20);
  assert.equal(searchRecords(records, { offset: 40 }).records.length, 5);
  assert.equal(searchRecords(records, { dataset: "ifrc" }).total, 0);
});
test("USGS does not infer humanitarian impact from magnitude or PAGER", () => {
  const result = usgsEvents({ features: [{ id: "us1", geometry: { type: "Point", coordinates: [10, 20, 5] }, properties: { title: "Earthquake", time: 1793145600000, updated: 1793145600000, url: "https://earthquake.usgs.gov/earthquakes/eventpage/us1", alert: "red", ids: ",us1,other1,", type: "earthquake" } }] }, reviewed);
  assert.equal(result[0].severity, "Insufficient data"); assert.equal(result[0].sourceAlert, "USGS PAGER: red");
  assert.deepEqual(result[0].identities, ["usgs:us1", "usgs:other1"]);
});
test("timezone-free provider dates are deterministic UTC and invalid dates fail", () => {
  assert.equal(feedDate.parse("2026-10-28T00:00:00"), "2026-10-28T00:00:00.000Z");
  assert.equal(feedDate.parse("2026-10-28T03:00:00+03:00"), "2026-10-28T00:00:00.000Z");
  assert.equal(feedDate.safeParse("invalid").success, false);
  assert.equal(formatDate("2026-10-31T23:59:59Z", "UTC"), "Oct 31, 2026");
});

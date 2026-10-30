import test from "node:test";
import assert from "node:assert/strict";
import { buildChatChart } from "../app/lib/chatCharts.ts";
import { checkoutInputSchema } from "../app/lib/chatWorkspace.ts";
import type { MapItem } from "../app/lib/types.ts";
const record: MapItem = {
  id: "a",
  country: "Kenya",
  location: "Kenya",
  coordinates: [37, 0],
  kind: "Hunger",
  summary: "Source observation",
  severity: "Insufficient data",
  source: {
    label: "Provider",
    url: "https://example.org/report",
    published: "2026-10-30",
    reviewed: "2026-10-30",
  },
  referencePeriod: { start: "2026-06-01", end: null },
  measurements: [{ metric: "ipc-3-plus", value: 1000 }],
};
test("chart counts source records without summing overlapping populations", () => {
  const result = buildChatChart([record, { ...record, id: "b" }], {
    type: "donut",
    metric: "records",
    groupBy: "cause",
  });
  assert.deepEqual(result.data, [{ label: "Hunger", value: 2 }]);
  assert.equal(result.unit, "Records");
  assert.equal(result.sources.length, 1);
});
test("time charts use reference months, exclude undated sources, and retain provenance", () => {
  const result = buildChatChart(
    [record, { ...record, id: "b", referencePeriod: undefined }],
    { type: "line", metric: "records", groupBy: "month" },
  );
  assert.deepEqual(result.data, [{ label: "2026-06", value: 1 }]);
  assert.equal(result.undatedCount, 1);
  assert.equal(result.recordCount, 2);
  assert.throws(() =>
    buildChatChart([record], {
      type: "area",
      metric: "records",
      groupBy: "country",
    }),
  );
});
test("funding comparisons deduplicate actual demo projects and reject unsupported combinations", () => {
  const project = {
    id: "demo",
    name: "Demo",
    organisation: "Sandbox",
    target: 100,
    raised: 30,
    reportedOutcome: null,
    demonstration: true as const,
  };
  const records = [
    { ...record, project },
    { ...record, id: "b", project },
  ];
  assert.deepEqual(
    buildChatChart(records, {
      type: "bar",
      metric: "funding-gap",
      groupBy: "project",
    }).data,
    [{ label: "Demo", value: 70 }],
  );
  assert.throws(() =>
    buildChatChart(records, {
      type: "donut",
      metric: "raised",
      groupBy: "project",
    }),
  );
  assert.throws(() =>
    buildChatChart(records, {
      type: "summary",
      metric: "raised",
      groupBy: "country",
    }),
  );
});
test("unknown IDs and excessive groups fail explicitly instead of drawing fabricated or truncated values", () => {
  assert.throws(() =>
    buildChatChart([record], {
      type: "bar",
      metric: "records",
      groupBy: "country",
      recordIds: ["missing"],
    }),
  );
  assert.throws(() =>
    buildChatChart(
      Array.from({ length: 25 }, (_, i) => ({
        ...record,
        id: String(i),
        country: String(i),
      })),
      { type: "bar", metric: "records", groupBy: "country" },
    ),
  );
  assert.deepEqual(checkoutInputSchema.parse({}), {});
});

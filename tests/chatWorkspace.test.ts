import { searchRecords } from "../app/lib/researchRecords.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { calculate } from "../app/lib/chatCalculation.ts";
import { saveChatRecords } from "../app/lib/saveChatRecords.ts";
import { emptyTracking, trackingSchema } from "../app/lib/tracking.ts";
import {
  paymentResultSchema,
  recordsResultSchema,
  mapFilterSchema,
} from "../app/lib/chatWorkspace.ts";
import type { MapItem } from "../app/lib/types.ts";
const record: MapItem = {
  id: "source-record",
  location: "Kenya",
  country: "Kenya",
  coordinates: [37, 0],
  kind: "Hunger",
  severity: "Insufficient data",
  summary: "Source assessment",
  source: {
    label: "Provider",
    url: "https://example.org/assessment",
    published: null,
    reviewed: "2026-10-30",
  },
  measurements: [{ metric: "ipc-3-plus", value: 1200 }],
  geographicPrecision: "Country centroid",
  referencePeriod: { start: "2026-10-01", end: null },
};

test("budget splits preserve every cent without inventing additional money", () => {
  const result = calculate({
    operation: "split",
    values: [100, 3],
    unit: "USD",
  });
  assert.deepEqual(result.shares, [33.34, 33.33, 33.33]);
  assert.equal(
    result.shares!.reduce((sum, amount) => sum + Math.round(amount * 100), 0),
    10000,
  );
  assert.throws(() => calculate({ operation: "split", values: [1.001, 3] }));
  assert.throws(() => calculate({ operation: "split", values: [1, 0] }));
  assert.throws(() => calculate({ operation: "split", values: [1, 2.5] }));
});
test("arithmetic rejects undefined and unsafe results", () => {
  assert.equal(
    calculate({ operation: "percentage", values: [25, 100] }).result,
    25,
  );
  assert.equal(
    calculate({ operation: "subtract", values: [100, 30, 20] }).result,
    50,
  );
  assert.throws(() => calculate({ operation: "divide", values: [10, 0] }));
  assert.throws(() =>
    calculate({ operation: "multiply", values: [1e12, 1e12] }),
  );
  assert.throws(() => calculate({ operation: "sum", values: [Infinity] }));
});
test("chat saves source records in one valid snapshot and reuses a named folder", () => {
  const input = { name: "Donation plan", recordIds: [record.id] };
  const saved = saveChatRecords(emptyTracking, [record], input, "tool-call-1");
  assert.equal(saved.result.count, 1);
  assert.deepEqual(saved.snapshot.savedItems[0], record);
  assert.deepEqual(saved.snapshot.interests[0].issueIds, [record.id]);
  assert.deepEqual(trackingSchema.parse(saved.snapshot), saved.snapshot);
  const repeated = saveChatRecords(
    saved.snapshot,
    [record],
    input,
    "tool-call-2",
  );
  assert.equal(repeated.snapshot.interests.length, 1);
  assert.equal(repeated.result.id, "tool-call-1");
  assert.deepEqual(repeated.snapshot.following, [record.id]);
});
test("chat cannot save unknown or duplicated records or silently lose folder assignments", () => {
  assert.throws(() =>
    saveChatRecords(
      emptyTracking,
      [record],
      { name: "Research", recordIds: ["fabricated"] },
      "call",
    ),
  );
  assert.throws(() =>
    saveChatRecords(
      emptyTracking,
      [record],
      { name: "Research", recordIds: [record.id, record.id] },
      "call",
    ),
  );
  const first = saveChatRecords(
    emptyTracking,
    [record],
    { name: "First", recordIds: [record.id] },
    "first",
  );
  const next = saveChatRecords(
    first.snapshot,
    [record],
    { name: "Second", recordIds: [record.id] },
    "second",
  );
  assert.deepEqual(
    next.snapshot.interests.find((folder) => folder.id === "first")!.issueIds,
    [],
  );
  assert.deepEqual(
    next.snapshot.interests.find((folder) => folder.id === "second")!.issueIds,
    [record.id],
  );
});
test("inline record results retain source units, dates and geography", () => {
  const result = recordsResultSchema.parse({
    kind: "records",
    total: 1,
    records: [record],
    nextOffset: null,
  });
  assert.deepEqual(result.records[0], record);
  assert.deepEqual(
    mapFilterSchema.parse({ country: "", causes: [], mode: "Heatmap" }).causes,
    [],
  );
});
test("payment cards reject non-sandbox or insecure approval URLs", () => {
  const base = {
    kind: "payment",
    id: "order",
    projectId: "demo",
    projectName: "Demonstration",
    amount: "25.00",
    currency: "USD",
    sandbox: true,
  };
  assert.ok(
    paymentResultSchema.safeParse({
      ...base,
      approvalUrl: "https://www.sandbox.paypal.com/checkoutnow?token=order",
    }).success,
  );
  for (const approvalUrl of [
    "https://www.paypal.com/checkoutnow",
    "http://www.sandbox.paypal.com/checkoutnow",
    "https://www.sandbox.paypal.com.example.org",
    "javascript:alert(1)",
  ])
    assert.equal(
      paymentResultSchema.safeParse({ ...base, approvalUrl }).success,
      false,
    );
});

test("catalogue search includes records whose dataset is implicit", () => {
  const result = searchRecords([record], { dataset: "catalogue" });
  assert.equal(result.total, 1);
  assert.equal(result.records[0].id, record.id);
});

test("funding comparisons sort actual sandbox gaps before paginating", () => {
  const project = {
    id: "small",
    name: "Small",
    organisation: "Sandbox",
    target: 100,
    raised: 80,
    reportedOutcome: null,
    demonstration: true as const,
  };
  const small = { ...record, id: "small", project };
  const large = {
    ...record,
    id: "large",
    project: {
      ...project,
      id: "large",
      name: "Large",
      target: 500,
      raised: 100,
    },
  };
  assert.deepEqual(
    searchRecords([small, record, large], { sort: "funding-gap" }).records.map(
      (item) => item.id,
    ),
    ["large", "small", record.id],
  );
});

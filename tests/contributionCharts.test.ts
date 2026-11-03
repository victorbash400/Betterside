import test from "node:test";
import assert from "node:assert/strict";
import { buildContributionChart } from "../app/lib/contributionCharts.ts";
import type { Contribution } from "../app/lib/types.ts";
const payment: Contribution = {
  id: "order", projectId: "project", projectName: "Water project", amount: "25.00", currency: "USD",
  status: "COMPLETED", createdAt: "2026-09-30T10:00:00Z", completedAt: "2026-10-01T10:00:00Z",
};
test("paid charts use completed amounts net of refunds and completion month", () => {
  const result = buildContributionChart([
    { ...payment, refundedCents: 500 },
    { ...payment, id: "pending", status: "CREATED" },
    { ...payment, id: "failed", status: "FAILED" },
    { ...payment, id: "refunded", status: "REFUNDED" },
    { ...payment, id: "undated", completedAt: undefined },
  ], { type: "line", metric: "paid", groupBy: "month" });
  assert.deepEqual(result.data, [{ label: "2026-10", value: 20 }]);
  assert.equal(result.undatedCount, 1);
  assert.equal(result.unit, "USD");
  assert.equal(result.basis, "contributions");
});
test("refunds retain exact cents and orders remain distinct from captured money", () => {
  const records = [{ ...payment, refundedCents: 1 }, { ...payment, id: "refunded", status: "REFUNDED" as const }];
  assert.deepEqual(buildContributionChart(records, { type: "column", metric: "refunded", groupBy: "project" }).data, [{ label: "Water project", value: 25.01 }]);
  const orders = buildContributionChart([{ ...payment, status: "CREATED" }], { type: "pie", metric: "orders", groupBy: "status" });
  assert.equal(orders.unit, "Orders");
  assert.deepEqual(orders.data, [{ label: "CREATED", value: 1 }]);
});
test("contribution charts enforce filters and reject misleading time axes", () => {
  assert.throws(() => buildContributionChart([payment], { type: "line", metric: "paid", groupBy: "project" }), (error: unknown) => error instanceof Error && error.message.includes("monthly"));
  assert.throws(() => buildContributionChart([payment], { type: "bar", metric: "paid", groupBy: "month", through: "2026-09-30" }), (error: unknown) => error instanceof Error && error.message.includes("No matching"));
  assert.throws(() => buildContributionChart([payment], { type: "bar", metric: "paid", groupBy: "month", from: "2026-11-01", through: "2026-10-01" }), (error: unknown) => error instanceof Error && error.message.includes("valid"));
});

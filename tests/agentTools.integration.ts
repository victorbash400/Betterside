import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import { emptyTracking } from "../app/lib/tracking.ts";
const previousTable = process.env.DYNAMODB_TABLE_NAME;
process.env.DYNAMODB_TABLE_NAME = "Tooling-test-fixture";
after(() => { if (previousTable === undefined) delete process.env.DYNAMODB_TABLE_NAME; else process.env.DYNAMODB_TABLE_NAME = previousTable; });
const { workspaceTools } = await import("../app/tools/index.ts");
const { database } = await import("../app/server/aws.ts");
const context = { donor: "account-a", origin: "http://localhost:3000", records: [] };
const tools = workspaceTools(context);
const options = { toolCallId: "test-call", messages: [], context: {} };

test("registered tools expose pins, trends, receipts, ledger charts and subscription lifecycle", async () => {
  for (const name of ["list_pins", "pin_items", "unpin_items", "show_trends", "manage_goal", "get_contribution", "show_contribution_chart", "show_contribution_report", "get_paypal_status"])
    assert.equal(name in tools, true);
  assert.equal(tools.pin_items.execute, undefined);
  assert.equal(tools.unpin_items.execute, undefined);
  const approval = tools.manage_goal.needsApproval;
  assert.equal(typeof approval, "function");
  if (typeof approval !== "function") throw new Error("Approval handler missing.");
  assert.equal(await approval({ action: "cancel", goalId: "goal", revision: 1 }, options), true);
  assert.equal(await approval({ action: "refresh", goalId: "goal", revision: 1 }, options), false);
});

test("pin listing reads only the requesting account and paginates", async () => {
  const reads: string[] = [];
  const stub = mock.method(database, "send", async (command: { input: { Key: { pk: string } } }) => {
    reads.push(command.input.Key.pk);
    return { Item: { revision: 1, snapshot: { ...emptyTracking, interests: Array.from({ length: 25 }, (_, index) => ({ id: `pin-${index}`, name: `Pin ${index}`, issueIds: [], hiddenKinds: [] })) } } };
  });
  try {
    const result = await tools.list_pins.execute!({ offset: 20 }, options) as { pins: unknown[]; total: number; nextOffset: number | null };
    assert.deepEqual(reads, ["DONOR#account-a"]);
    assert.equal(result.pins.length, 5);
    assert.equal(result.total, 25);
    assert.equal(result.nextOffset, null);
  } finally { stub.mock.restore(); }
});

test("receipts cannot expose another account's payment", async () => {
  const stub = mock.method(database, "send", async () => ({ Item: { id: "order", donor: "account-b" } }));
  try {
    await assert.rejects(async () => { await tools.get_contribution.execute!({ orderId: "order" }, options); }, { message: "Contribution unavailable." });
  } finally { stub.mock.restore(); }
});

test("inline contribution reports read the signed-in ledger and account for refunds and capture dates", async () => {
  const keys: string[] = [];
  const capture = {
    projectId: "water", projectName: "Water access", amount: "10.00",
    currency: "USD", createdAt: "2026-09-28T12:00:00Z",
    completedAt: "2026-09-30T23:00:00-02:00",
  };
  const stub = mock.method(database, "send", async (command: {
    input: { ExpressionAttributeValues: { ":pk": string } };
  }) => {
    keys.push(command.input.ExpressionAttributeValues[":pk"]);
    return { Items: [
      { ...capture, id: "partial", status: "REFUNDED", refundedCents: 325, captureId: "provider-id" },
      { ...capture, id: "full", status: "REFUNDED" },
      { ...capture, id: "pending", status: "CREATED" },
      { ...capture, id: "legacy", status: "COMPLETED", completedAt: undefined },
    ] };
  });
  try {
    const report = await tools.show_contribution_report.execute!(
      { groupBy: "month", from: "2026-10-01", through: "2026-10-01" },
      options,
    );
    assert.deepEqual(keys, ["DONOR#account-a"]);
    assert.deepEqual(report, {
      groupBy: "month", from: "2026-10-01", through: "2026-10-01", undated: 1,
      rows: [
        { order: "partial", project: "Water access", date: "2026-10-01", month: "2026-10", netCents: 675, refundCents: 325 },
        { order: "full", project: "Water access", date: "2026-10-01", month: "2026-10", netCents: 0, refundCents: 1000 },
      ],
    });
  } finally {
    stub.mock.restore();
  }
});

test("PayPal status tools return a validated, credential-free inline result", async () => {
  const stub = mock.method(database, "send", async () => ({}));
  try {
    const result = await tools.get_paypal_status.execute!({}, options) as Record<string, unknown>;
    assert.equal(result.kind, "paypal-status");
    assert.equal(result.environment, "sandbox");
    assert.equal(result.connected, false);
    assert.equal(typeof result.checkoutConfigured, "boolean");
    assert.equal("access_token" in result, false);
  } finally { stub.mock.restore(); }
});

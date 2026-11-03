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
  for (const name of ["list_pins", "pin_items", "unpin_items", "show_trends", "manage_goal", "get_contribution", "show_contribution_chart", "get_paypal_status"])
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

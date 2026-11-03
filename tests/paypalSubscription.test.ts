import test from "node:test";
import assert from "node:assert/strict";
import {
  subscriptionLocked,
  subscriptionSchema,
  subscriptionStatusSchema,
} from "../app/lib/paypalSubscription.ts";

test("pending, approved, active and suspended subscriptions keep billing edits locked", () => {
  for (const status of subscriptionStatusSchema.options) {
    assert.equal(
      subscriptionLocked(status),
      status !== "CANCELLED" && status !== "EXPIRED",
    );
  }
});

test("subscription responses retain provider approval state and remove private fields", () => {
  const subscription = subscriptionSchema.parse({
    id: "I-TEST",
    goalId: "goal",
    projectId: "project",
    projectName: "Project",
    amount: "1.00",
    status: "APPROVAL_PENDING",
    nextBillingTime: null,
    approvalUrl: "https://www.sandbox.paypal.com/approve",
    owner: "private",
    planId: "private",
  });
  assert.equal(subscription.status, "APPROVAL_PENDING");
  assert.equal("owner" in subscription, false);
  assert.equal("planId" in subscription, false);
  assert.equal(
    subscriptionSchema.safeParse({ ...subscription, status: "SUCCESS" })
      .success,
    false,
  );
});

test("subscription setup only accepts funded causes, recipients and valid monthly amounts", async () => {
  const { subscriptionSetupSchema, subscriptionProjects } =
    await import("../app/lib/subscriptionSetup.ts");
  const { goalMatchesProject } = await import("../app/lib/profile.ts");
  const records = [
    {
      id: "water",
      kind: "Water",
      project: { id: "water-project", demonstration: true },
    },
    {
      id: "health",
      kind: "Health",
      project: { id: "health-project", demonstration: true },
    },
    { id: "observation", kind: "Water" },
  ] as unknown as import("../app/lib/types.ts").MapItem[];
  assert.deepEqual(
    subscriptionProjects(records, "Water").map((item) => item.id),
    ["water"],
  );
  assert.deepEqual(subscriptionProjects(records, "Conflict"), []);
  assert.equal(
    goalMatchesProject(
      { category: "Water", projectId: "health-project" },
      records[0],
    ),
    false,
  );
  const input = {
    goalId: "goal",
    projectId: "water-project",
    category: "Water",
    amount: "25.00",
  };
  assert.equal(subscriptionSetupSchema.safeParse(input).success, true);
  for (const amount of ["0", "-1", "1.001", "1e2", "10000.01", ""]) {
    assert.equal(
      subscriptionSetupSchema.safeParse({ ...input, amount }).success,
      false,
    );
  }
  assert.equal(
    subscriptionSetupSchema.safeParse({
      ...input,
      organization: { id: "unrelated" },
    }).success,
    false,
  );
});

test("a pending amount change keeps the authorized amount separate", () => {
  const record = subscriptionSchema.parse({
    id: "I-TEST",
    goalId: "goal",
    projectId: "water-project",
    projectName: "Water",
    amount: "25.00",
    status: "ACTIVE",
    nextBillingTime: null,
    approvalUrl: null,
    pendingChange: {
      amount: "50.00",
      approvalUrl: "https://www.sandbox.paypal.com/reapprove",
    },
  });
  assert.equal(record.amount, "25.00");
  assert.equal(record.pendingChange?.amount, "50.00");
});

test("PayPal empty transaction responses are valid without accepting malformed data", async () => {
  const { subscriptionTransactionsSchema } =
    await import("../app/lib/subscriptionTransactions.ts");
  assert.deepEqual(subscriptionTransactionsSchema.parse({}), {
    transactions: [],
    links: [],
  });
  assert.deepEqual(subscriptionTransactionsSchema.parse({ transactions: [] }), {
    transactions: [],
  });
  for (const response of [
    null,
    [],
    { transactions: null },
    { transactions: "invalid" },
    { error: "provider failure" },
    { transactions: [{}] },
  ]) {
    assert.equal(
      subscriptionTransactionsSchema.safeParse(response).success,
      false,
    );
  }
});

test("saved goals snapshots expose payment status without provider secrets", async () => {
  const { goalsSnapshotSchema } = await import("../app/lib/goalsSnapshot.ts");
  const result = goalsSnapshotSchema.parse({
    profile: { name: "Test", timeZone: "Africa/Nairobi", goals: [] },
    revision: 1,
    contributions: [],
    subscriptions: [
      {
        id: "I-TEST",
        goalId: "goal",
        projectId: "project",
        projectName: "Water",
        amount: "1.00",
        status: "ACTIVE",
        nextBillingTime: null,
        approvalUrl: null,
        owner: "private",
        planId: "private",
        productId: "private",
        recipient: "private",
      },
    ],
  });
  assert.equal(result.subscriptions[0].status, "ACTIVE");
  for (const key of ["owner", "planId", "productId", "recipient"])
    assert.equal(key in result.subscriptions[0], false);
});

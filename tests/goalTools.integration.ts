import { manageGoalTool } from "../app/tools/manage-goal.ts";
import { getContributionTool } from "../app/tools/get-contribution.ts";
import { showContributionChartTool } from "../app/tools/show-contribution-chart.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { database, requireTable } from "../app/server/aws.ts";
import { listGoalsTool } from "../app/tools/list-goals.ts";
import { createGoalTool } from "../app/tools/create-goal.ts";
import { updateGoalTool } from "../app/tools/update-goal.ts";
import { goalsResultSchema } from "../app/lib/chatGoals.ts";
import { loadCatalogue } from "../app/server/catalogue.ts";
import { loadProfile, saveProfile } from "../app/server/profile.ts";
import {
  goalSubscription,
  storeSubscription,
} from "../app/server/subscriptionStore.ts";
import {
  manageSubscription,
  refreshSubscription,
  syncSubscriptionPayments,
  reconcileDonorSubscriptions,
} from "../app/server/subscriptions.ts";
import { contributions } from "../app/server/contributions.ts";
import { goalProgress } from "../app/lib/profile.ts";
import { handleSubscriptionWebhook } from "../app/server/subscriptionWebhook.ts";
const options = { toolCallId: "qa-create", messages: [], context: {} };

test("subscription setup, reapproval, lifecycle and mixed-price payments use real isolated storage", async () => {
  assert.equal(requireTable(), "BetterSide-dev");
  const donor = `qa-subscriptions-${randomUUID()}`;
  let subscriptionId = `I-${randomUUID().slice(0, 12)}`;
  const subscriptionIds = [subscriptionId];
  const context = {
    donor,
    records: await loadCatalogue(),
    origin: "http://localhost:3000",
  };
  const project = context.records.find((item) => item.kind === "Water")!;
  const input = {
    projectId: project.project.id,
    category: project.kind,
    targetCents: 2500,
    period: "monthly" as const,
    revision: 0,
  };
  const originalFetch = globalThis.fetch;
  let providerStatus = "APPROVAL_PENDING",
    providerPlan = "P-original",
    revisionPlan = "";
  let creates = 0,
    plans = 0;
  const transactions: {
    id: string;
    status: string;
    time: string;
    amount_with_breakdown: {
      gross_amount: { currency_code: string; value: string };
    };
  }[] = [];
  let goalId = "";
  globalThis.fetch = async (url, init) => {
    const target = new URL(String(url));
    if (target.origin !== "https://api-m.sandbox.paypal.com")
      return originalFetch(url, init);
    const body = init?.body ? String(init.body) : "";
    const data =
      target.pathname === "/v1/oauth2/token"
        ? { access_token: "test-token" }
        : target.pathname === "/v1/catalogs/products"
          ? { id: "PROD-test" }
          : target.pathname === "/v1/billing/plans"
            ? { id: ++plans === 1 ? "P-original" : "P-revised" }
            : target.pathname === "/v1/billing/subscriptions"
              ? (() => {
                  creates++;
                  goalId = JSON.parse(body).custom_id;
                  return {
                    id: subscriptionId,
                    status: providerStatus,
                    links: [
                      {
                        rel: "approve",
                        href: "https://www.sandbox.paypal.com/approve",
                      },
                    ],
                  };
                })()
              : target.pathname.endsWith("/transactions")
                ? transactions.length === 0
                  ? {}
                  : {
                      transactions:
                        transactions.length < 2
                          ? transactions
                          : target.searchParams.has("page")
                            ? transactions.slice(1)
                            : transactions.slice(0, 1),
                      links:
                        transactions.length > 1 &&
                        !target.searchParams.has("page")
                          ? [
                              {
                                rel: "next",
                                href: `${target.origin}${target.pathname}?page=2`,
                              },
                            ]
                          : [],
                    }
                : target.pathname.endsWith("/revise")
                  ? (() => {
                      revisionPlan = JSON.parse(body).plan_id;
                      return {
                        links: [
                          {
                            rel: "approve",
                            href: "https://www.sandbox.paypal.com/reapprove",
                          },
                        ],
                      };
                    })()
                  : target.pathname.endsWith("/suspend")
                    ? ((providerStatus = "SUSPENDED"), {})
                    : target.pathname.endsWith("/activate")
                      ? ((providerStatus = "ACTIVE"), {})
                      : target.pathname.endsWith("/cancel")
                        ? ((providerStatus = "CANCELLED"), {})
                        : target.pathname ===
                            `/v1/billing/subscriptions/${subscriptionId}`
                          ? {
                              id: subscriptionId,
                              plan_id: providerPlan,
                              custom_id: goalId,
                              status: providerStatus,
                            }
                          : (() => {
                              throw new Error(
                                `Unexpected provider request ${target.pathname}`,
                              );
                            })();
    return Response.json(data);
  };
  try {
    const create = createGoalTool(context);
    const initial = goalsResultSchema.parse(
      await listGoalsTool(context).execute!({}, options),
    );
    assert.equal(initial.revision, 0);
    await assert.rejects(
      async () => create.execute!({ ...input, category: "Health" }, options),
      { message: "Choose a project that supports this cause." },
    );
    assert.equal((await loadProfile(donor)).revision, 0);
    const created = goalsResultSchema.parse(
      await create.execute!(input, options),
    );
    assert.equal(created.goals[0].projectId, project.project.id);
    assert.equal(created.goals[0].targetCents, 2500);
    assert.equal(
      (await goalSubscription(donor, goalId))?.status,
      "APPROVAL_PENDING",
    );
    await create.execute!(input, options);
    assert.equal(creates, 1);
    await assert.rejects(async () =>
      create.execute!({ ...input, targetCents: 3000 }, options),
    );
    providerStatus = "ACTIVE";
    await handleSubscriptionWebhook({
      id: `event-${subscriptionId}`,
      event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
      resource: { id: subscriptionId },
    });
    assert.equal((await goalSubscription(donor, goalId))?.status, "ACTIVE");
    const profile = await loadProfile(donor);
    await assert.rejects(
      saveProfile(donor, { ...profile.profile, goals: [] }, profile.revision),
      {
        message:
          "Cancel the PayPal subscription before changing billing or deleting this goal.",
      },
    );
    await assert.rejects(
      async () =>
        updateGoalTool({ ...context, donor: `${donor}-other` }).execute!(
          { goalId, revision: 0, targetCents: 5000 },
          options,
        ),
      { message: "Subscription not found." },
    );
    await updateGoalTool(context).execute!(
      { goalId, revision: profile.revision, targetCents: 5000 },
      options,
    );
    let current = (await goalSubscription(donor, goalId))!;
    assert.equal(current.amount, "25.00");
    assert.equal(current.pendingChange?.amount, "50.00");
    assert.equal((await loadProfile(donor)).profile.goals[0].targetCents, 2500);
    providerPlan = revisionPlan;
    current = await refreshSubscription(current);
    assert.equal(current.amount, "50.00");
    assert.equal(current.pendingChange, null);
    assert.equal((await loadProfile(donor)).profile.goals[0].targetCents, 5000);
    for (const amount of ["25.00", "50.00"])
      transactions.push({
        id: `${subscriptionId}-${amount}`,
        status: "COMPLETED",
        time: new Date().toISOString(),
        amount_with_breakdown: {
          gross_amount: { currency_code: "USD", value: amount },
        },
      });
    await syncSubscriptionPayments(current);
    await syncSubscriptionPayments(current);
    const ledger = await contributions(donor);
    assert.equal(ledger.length, 2);
    assert.equal(
      ledger.every((item) => item.status === "COMPLETED"),
      true,
    );
    const after = await loadProfile(donor);
    assert.equal(
      goalProgress(after.profile.goals[0], ledger, after.profile.timeZone)
        .cents,
      7500,
    );
    const revision = (await loadProfile(donor)).revision;
    const paused = goalsResultSchema.parse(await manageGoalTool(context).execute!({ goalId, revision, action: "pause" }, options));
    assert.equal(paused.subscriptions[0].status, "SUSPENDED");
    assert.equal((await manageSubscription(donor, goalId, "pause")).status, "SUSPENDED");
    await assert.rejects(async () => { await manageGoalTool(context).execute!({ goalId, revision: 0, action: "cancel" }, options); }, { message: "Goals changed. Read list_goals again." });
    const receipt = await getContributionTool(context).execute!({ orderId: ledger[0].id }, options) as { records: { id: string; donor?: string }[] };
    assert.equal(receipt.records[0].id, ledger[0].id);
    assert.equal(receipt.records[0].donor, undefined);
    const chart = await showContributionChartTool(context).execute!({ type: "column", metric: "paid", groupBy: "project" }, options) as { data: { value: number }[] };
    assert.equal(chart.data[0].value, 75);
    assert.equal(
      (await manageSubscription(donor, goalId, "resume")).status,
      "ACTIVE",
    );
    current = (await goalSubscription(donor, goalId))!;
    await storeSubscription(current);
    await assert.rejects(storeSubscription(current));
    assert.equal(
      (await manageSubscription(donor, goalId, "cancel")).status,
      "CANCELLED",
    );
    const last = await loadProfile(donor);
    await saveProfile(donor, { ...last.profile, goals: [] }, last.revision);
    assert.equal((await loadProfile(donor)).profile.goals.length, 0);
    await reconcileDonorSubscriptions(donor);
    assert.equal((await contributions(donor)).length, 2);
  } finally {
    globalThis.fetch = originalFetch;
    const ledger = await contributions(donor);
    const captured = ledger
      .filter((item) => item.status === "COMPLETED")
      .reduce((sum, item) => sum + Math.round(Number(item.amount) * 100), 0);
    if (captured)
      await database.send(
        new UpdateCommand({
          TableName: requireTable(),
          Key: { pk: `PROJECT#${project.project.id}`, sk: "FUNDING" },
          UpdateExpression: "ADD receivedCents :amount",
          ExpressionAttributeValues: { ":amount": -captured },
        }),
      );
    const rows = await database.send(
      new QueryCommand({
        TableName: requireTable(),
        KeyConditionExpression: "pk=:pk",
        ExpressionAttributeValues: { ":pk": `DONOR#${donor}` },
      }),
    );
    await Promise.all([
      ...(rows.Items ?? []).map((item) =>
        database.send(
          new DeleteCommand({
            TableName: requireTable(),
            Key: { pk: item.pk, sk: item.sk },
          }),
        ),
      ),
      ...ledger.map((item) =>
        database.send(
          new DeleteCommand({
            TableName: requireTable(),
            Key: { pk: `PAYMENT#${item.id}`, sk: "META" },
          }),
        ),
      ),
      ...subscriptionIds.map((id) =>
        database.send(
          new DeleteCommand({
            TableName: requireTable(),
            Key: { pk: `SUBSCRIPTION#${id}`, sk: "META" },
          }),
        ),
      ),
    ]);
  }
});

test("late events for a cancelled subscription cannot replace its renewal", async () => {
  const owner = `qa-renewal-${randomUUID()}`;
  const goalId = randomUUID();
  const base = {
    owner,
    goalId,
    version: 0,
    projectId: "test-project",
    projectName: "Test project",
    amount: "25.00",
    status: "CANCELLED" as const,
    nextBillingTime: null,
    approvalUrl: null,
    planId: "P-test",
    productId: "PROD-test",
    projectKey: "test-key",
    recipient: "test-recipient",
    createdAt: new Date().toISOString(),
  };
  const oldId = `I-${randomUUID()}`,
    newId = `I-${randomUUID()}`;
  try {
    const old = await storeSubscription({ ...base, id: oldId });
    await storeSubscription({
      ...base,
      id: newId,
      status: "ACTIVE",
      amount: "50.00",
    });
    await storeSubscription({ ...old, nextBillingTime: null });
    const current = await goalSubscription(owner, goalId);
    assert.equal(current?.id, newId);
    assert.equal(current?.status, "ACTIVE");
    assert.equal(current?.amount, "50.00");
  } finally {
    await Promise.all([
      ...[oldId, newId].map((id) =>
        database.send(
          new DeleteCommand({
            TableName: requireTable(),
            Key: { pk: `SUBSCRIPTION#${id}`, sk: "META" },
          }),
        ),
      ),
      database.send(
        new DeleteCommand({
          TableName: requireTable(),
          Key: { pk: `DONOR#${owner}`, sk: `SUBSCRIPTION#${goalId}` },
        }),
      ),
    ]);
  }
});

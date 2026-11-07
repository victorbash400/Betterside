import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { database, requireTable } from "./aws.ts";
import { PayPalRequestError, paypalRequest } from "./paypal.ts";
import { loadProfile } from "./profile.ts";
import { loadCatalogue } from "./catalogue.ts";
import { goalMatchesProject } from "../lib/profile.ts";
import { amountInCents, decimalAmount } from "../lib/payment.ts";
import {
  subscriptionLocked,
  subscriptionStatusSchema,
} from "../lib/paypalSubscription.ts";
import {
  goalSubscription,
  donorSubscriptions,
  storeSubscription,
  type StoredSubscription,
} from "./subscriptionStore.ts";
import { syncSubscriptionPayments } from "./subscriptionPayments.ts";
export { syncSubscriptionPayments } from "./subscriptionPayments.ts";
const detailsSchema = z.object({
  id: z.string(),
  plan_id: z.string(),
  custom_id: z.string(),
  status: subscriptionStatusSchema,
  billing_info: z
    .object({ next_billing_time: z.string().optional() })
    .optional(),
});
const refreshing = new Map<string, Promise<StoredSubscription>>();
export function refreshSubscription(record: StoredSubscription) {
  const pending = refreshing.get(record.id);
  if (pending) return pending;
  const request = readSubscription(record).finally(() =>
    refreshing.delete(record.id),
  );
  refreshing.set(record.id, request);
  return request;
}
async function readSubscription(record: StoredSubscription, canCancel = true): Promise<StoredSubscription> {
  const path = `/v1/billing/subscriptions/${encodeURIComponent(record.id)}`;
  const details = await paypalRequest(path).then(
    (response) => detailsSchema.parse(response),
    (error: unknown) => {
      if (record.discarded && record.status === "APPROVAL_PENDING" &&
        error instanceof PayPalRequestError && error.status === 404) return null;
      throw error;
    },
  );
  if (!details) return record;
  if (
    details.id !== record.id ||
    (details.plan_id !== record.planId &&
      details.plan_id !== record.pendingPlanId) ||
    details.custom_id !== record.goalId
  )
    throw new Error("Subscription details do not match this goal.");
  const revised = Boolean(
    record.pendingPlanId && details.plan_id === record.pendingPlanId,
  );
  const terminal =
    details.status === "CANCELLED" || details.status === "EXPIRED";
  if (record.discarded && !terminal && details.status !== "APPROVAL_PENDING") {
    if (!canCancel) throw new Error("PayPal has not confirmed cancellation of the deleted goal.");
    await paypalRequest(`${path}/cancel`, { reason: "Goal deleted before PayPal approval." });
    return readSubscription(record, false);
  }
  const next = {
    ...record,
    planId: details.plan_id,
    amount: revised ? record.pendingChange!.amount : record.amount,
    pendingPlanId: revised || terminal ? undefined : record.pendingPlanId,
    pendingChange: revised || terminal ? null : record.pendingChange,
    status: details.status,
    nextBillingTime: details.billing_info?.next_billing_time ?? null,
    approvalUrl:
      details.status === "APPROVAL_PENDING" ? record.approvalUrl : null,
  };
  const changed =
    revised ||
    next.status !== record.status ||
    next.nextBillingTime !== record.nextBillingTime ||
    next.approvalUrl !== record.approvalUrl ||
    (terminal && Boolean(record.pendingChange));
  const stored = changed ? await storeSubscription(next) : record;
  if (stored.discarded) return stored;
  const current = await goalSubscription(record.owner, record.goalId);
  if (current && current.id !== record.id) return stored;
  {
    const state = await loadProfile(record.owner);
    const index = state.profile.goals.findIndex(
      (goal) => goal.id === record.goalId,
    );
    if (index < 0) {
      if (terminal) return stored;
      throw new Error("Subscription goal is missing.");
    }
    if (state.profile.goals[index].targetCents !== amountInCents(stored.amount))
      await database.send(
        new UpdateCommand({
          TableName: requireTable(),
          Key: { pk: `DONOR#${record.owner}`, sk: "PROFILE" },
          UpdateExpression: `SET profile.goals[${index}].targetCents=:amount, revision=:next`,
          ConditionExpression: `revision=:revision AND profile.goals[${index}].id=:goal`,
          ExpressionAttributeValues: {
            ":amount": amountInCents(stored.amount),
            ":next": state.revision + 1,
            ":revision": state.revision,
            ":goal": record.goalId,
          },
        }),
      );
  }
  return stored;
}
export async function reconcileDonorSubscriptions(owner: string) {
  const records = await donorSubscriptions(owner);
  for (let offset = 0; offset < records.length; offset += 3) {
    await Promise.all(
      records.slice(offset, offset + 3).map(async (record) => {
        const current = await refreshSubscription(record);
        if (current.status !== "APPROVAL_PENDING")
          await syncSubscriptionPayments(current);
      }),
    );
  }
}
export async function reviseSubscription(
  owner: string,
  goalId: string,
  amount: string,
  origin: string,
) {
  const cents = amountInCents(amount);
  if (cents < 100 || cents > 1000000)
    throw new Error("Enter an amount from $1 to $10,000.");
  const previous = await goalSubscription(owner, goalId);
  if (!previous) throw new Error("Subscription not found.");
  let current = await refreshSubscription(previous);
  if (current.status !== "ACTIVE" && current.status !== "SUSPENDED")
    throw new Error("Approve this subscription before adjusting its amount.");
  if (amountInCents(current.amount) === cents && !current.pendingChange)
    return current;
  if (
    current.pendingChange &&
    amountInCents(current.pendingChange.amount) !== cents
  )
    throw new Error(
      "Approve the pending amount change before requesting another.",
    );
  if (!current.pendingPlanId) {
    const plan = z.object({ id: z.string() }).parse(
      await paypalRequest(
        "/v1/billing/plans",
        {
          product_id: current.productId,
          name: `Monthly ${current.projectName}`.slice(0, 127),
          status: "ACTIVE",
          billing_cycles: [
            {
              frequency: { interval_unit: "MONTH", interval_count: 1 },
              tenure_type: "REGULAR",
              sequence: 1,
              total_cycles: 0,
              pricing_scheme: {
                fixed_price: {
                  value: decimalAmount(cents),
                  currency_code: "USD",
                },
              },
            },
          ],
          payment_preferences: {
            auto_bill_outstanding: false,
            payment_failure_threshold: 1,
          },
        },
        `${current.id}-${cents}-plan`,
      ),
    );
    current = await storeSubscription({
      ...current,
      pendingPlanId: plan.id,
      pendingChange: { amount: decimalAmount(cents), approvalUrl: null },
    });
  }
  const revision = z
    .object({ links: z.array(z.object({ rel: z.string(), href: z.url() })) })
    .parse(
      await paypalRequest(
        `/v1/billing/subscriptions/${encodeURIComponent(current.id)}/revise`,
        {
          plan_id: current.pendingPlanId,
          application_context: {
            brand_name: "BetterSide Sandbox",
            return_url: `${origin}/paypal/subscription?goalId=${encodeURIComponent(goalId)}`,
            cancel_url: `${origin}/paypal/subscription?goalId=${encodeURIComponent(goalId)}&cancelled=1`,
          },
        },
        createHash("sha256")
          .update(JSON.stringify([current.id, current.pendingPlanId]))
          .digest("hex")
          .slice(0, 32),
      ),
    );
  const approvalUrl = revision.links.find(
    (link) => link.rel === "approve",
  )?.href;
  if (
    !approvalUrl ||
    new URL(approvalUrl).origin !== "https://www.sandbox.paypal.com"
  )
    throw new Error(
      "PayPal did not return an amount-change approval link. Retry.",
    );
  return storeSubscription({
    ...current,
    pendingChange: { amount: decimalAmount(cents), approvalUrl },
  });
}
export async function createSubscription(
  owner: string,
  goalId: string,
  projectId: string,
  origin: string,
) {
  if (!process.env.PAYPAL_WEBHOOK_ID)
    throw new Error("Configure the PayPal subscription webhook first.");
  const current = await goalSubscription(owner, goalId);
  if (current?.discarded) throw new Error("This goal was deleted. Create a new goal.");
  if (current && subscriptionLocked(current.status))
    return refreshSubscription(current);
  const goal = (await loadProfile(owner)).profile.goals.find(
    (item) => item.id === goalId,
  );
  if (
    !goal ||
    goal.period !== "monthly" ||
    goal.organization ||
    goal.status === "paused"
  )
    throw new Error("Choose an active monthly sandbox goal.");
  const project = (await loadCatalogue()).find(
    (item) => item.project.id === projectId && goalMatchesProject(goal, item),
  );
  if (!project) throw new Error("Choose a matching sandbox project.");
  const amount = decimalAmount(goal.targetCents);
  amountInCents(amount);
  const recipient = process.env.PAYPAL_MERCHANT_ID;
  if (!recipient) throw new Error("Configure PAYPAL_MERCHANT_ID.");
  const key = { pk: `DONOR#${owner}`, sk: `SUBSCRIPTION#${goalId}` };
  const now = Date.now();
  const lease = await database.send(
    new UpdateCommand({
      TableName: requireTable(),
      Key: key,
      UpdateExpression: current
        ? "SET creatingUntil=:until, creationId=:creation"
        : "SET creatingUntil=:until, creationId=if_not_exists(creationId,:creation)",
      ConditionExpression:
        "(attribute_not_exists(creatingUntil) OR creatingUntil < :now) AND (attribute_not_exists(#id) OR #status IN (:cancelled,:expired))",
      ExpressionAttributeNames: { "#id": "id", "#status": "status" },
      ExpressionAttributeValues: {
        ":until": now + 120000,
        ":now": now,
        ":creation": createHash("sha256")
          .update(
            JSON.stringify([
              owner,
              goalId,
              current?.id ?? "first",
              projectId,
              amount,
            ]),
          )
          .digest("hex")
          .slice(0, 24),
        ":cancelled": "CANCELLED",
        ":expired": "EXPIRED",
      },
      ReturnValues: "ALL_NEW",
    }),
  );
  const creationId = z.string().parse(lease.Attributes?.creationId);
  const latest = (await loadProfile(owner)).profile.goals.find(
    (item) => item.id === goalId,
  );
  if (
    !latest ||
    latest.targetCents !== goal.targetCents ||
    latest.period !== "monthly" ||
    latest.organization ||
    latest.status === "paused"
  )
    throw new Error("Goal changed. Refresh before subscribing.");
  const product = z.object({ id: z.string() }).parse(
    await paypalRequest(
      "/v1/catalogs/products",
      {
        name: "BetterSide Sandbox monthly contribution",
        type: "SERVICE",
        category: "NONPROFIT",
      },
      `${creationId}-product`,
    ),
  );
  const plan = z.object({ id: z.string() }).parse(
    await paypalRequest(
      "/v1/billing/plans",
      {
        product_id: product.id,
        name: `Monthly ${project.project.name}`.slice(0, 127),
        status: "ACTIVE",
        billing_cycles: [
          {
            frequency: { interval_unit: "MONTH", interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: { value: amount, currency_code: "USD" },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: false,
          payment_failure_threshold: 1,
        },
      },
      `${creationId}-plan`,
    ),
  );
  const raw = z
    .object({
      id: z.string(),
      status: subscriptionStatusSchema,
      links: z.array(z.object({ rel: z.string(), href: z.url() })),
    })
    .parse(
      await paypalRequest(
        "/v1/billing/subscriptions",
        {
          plan_id: plan.id,
          custom_id: goalId,
          application_context: {
            brand_name: "BetterSide Sandbox",
            shipping_preference: "NO_SHIPPING",
            user_action: "SUBSCRIBE_NOW",
            return_url: `${origin}/paypal/subscription?goalId=${encodeURIComponent(goalId)}`,
            cancel_url: `${origin}/paypal/subscription?goalId=${encodeURIComponent(goalId)}&cancelled=1`,
          },
        },
        `${creationId}-subscription`,
      ),
    );
  const approvalUrl = raw.links.find((link) => link.rel === "approve")?.href;
  if (
    !approvalUrl ||
    new URL(approvalUrl).origin !== "https://www.sandbox.paypal.com"
  )
    throw new Error("Subscription approval URL rejected.");
  const record: StoredSubscription = {
    version: 0,
    id: raw.id,
    goalId,
    owner,
    projectId,
    projectName: project.project.name,
    projectKey: project.id,
    recipient,
    amount,
    status: raw.status,
    approvalUrl,
    nextBillingTime: null,
    planId: plan.id,
    productId: product.id,
    createdAt: new Date().toISOString(),
  };
  return storeSubscription(record);
}
export async function manageSubscription(
  owner: string,
  goalId: string,
  action: "pause" | "resume" | "cancel",
) {
  const stored = await goalSubscription(owner, goalId);
  if (!stored) throw new Error("Subscription not found.");
  const current = await refreshSubscription(stored);
  if (action === "cancel" && ["CANCELLED", "EXPIRED"].includes(current.status))
    return current;
  if (action === "cancel" && current.status === "APPROVAL_PENDING")
    throw new Error(
      "PayPal approval is pending. Cancel from PayPal after approval.",
    );
  if (action === "pause" && current.status === "SUSPENDED") return current;
  if (action === "resume" && current.status === "ACTIVE") return current;
  const method =
    action === "pause"
      ? "suspend"
      : action === "resume"
        ? "activate"
        : "cancel";
  if (action === "pause" && current.status !== "ACTIVE")
    throw new Error("Only active subscriptions can be paused.");
  if (action === "resume" && current.status !== "SUSPENDED")
    throw new Error("Only suspended subscriptions can be resumed.");
  await paypalRequest(
    `/v1/billing/subscriptions/${encodeURIComponent(current.id)}/${method}`,
    { reason: "Requested in BetterSide." },
  );
  return refreshSubscription(current);
}

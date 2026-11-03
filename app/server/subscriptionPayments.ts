import "server-only";
import {
  subscriptionTransactionsSchema,
  type SubscriptionTransaction,
} from "../lib/subscriptionTransactions.ts";
import { paypalRequest } from "./paypal.ts";
import { amountInCents } from "../lib/payment.ts";
import type { StoredSubscription } from "./subscriptionStore.ts";
import { payment, recordPayment, completePayment } from "./contributions.ts";
export async function syncSubscriptionPayments(record: StoredSubscription) {
  const endpoint = `/v1/billing/subscriptions/${encodeURIComponent(record.id)}/transactions`;
  let path: string | undefined =
    `${endpoint}?${new URLSearchParams({ start_time: record.createdAt, end_time: new Date().toISOString() })}`;
  const visited = new Set<string>();
  while (path) {
    if (visited.has(path))
      throw new Error("PayPal returned a repeated transaction page.");
    visited.add(path);
    const parsed = subscriptionTransactionsSchema.safeParse(
      await paypalRequest(path),
    );
    if (!parsed.success)
      throw new Error(
        "PayPal returned invalid transaction data. Retry payment sync.",
      );
    const data = parsed.data;
    for (const sale of data.transactions)
      await recordSubscriptionSale(record, sale);
    const next = data.links?.find((link) => link.rel === "next");
    path = undefined;
    if (next) {
      const url = new URL(next.href);
      if (
        ![
          "https://api-m.sandbox.paypal.com",
          "https://api.sandbox.paypal.com",
        ].includes(url.origin) ||
        url.pathname !== endpoint
      )
        throw new Error("PayPal transaction page URL rejected.");
      path = `${url.pathname}${url.search}`;
    }
  }
}
async function recordSubscriptionSale(
  record: StoredSubscription,
  sale: SubscriptionTransaction,
) {
  if (sale.status !== "COMPLETED") return;
  const amount = sale.amount_with_breakdown.gross_amount;
  if (amount.currency_code !== "USD" || amountInCents(amount.value) < 1)
    throw new Error("Subscription charge does not match its plan.");
  const id = `subscription-${sale.id}`;
  let existing = await payment(id);
  if (!existing) {
    try {
      await recordPayment({
        id,
        donor: record.owner,
        cents: amountInCents(amount.value),
        amount: amount.value,
        currency: "USD",
        projectId: record.projectId,
        goalId: record.goalId,
        projectKey: record.projectKey,
        projectName: record.projectName,
        recipient: record.recipient,
        status: "CREATED",
        createdAt: sale.time,
      });
    } catch (error) {
      if (
        !(error instanceof Error) ||
        error.name !== "TransactionCanceledException"
      )
        throw error;
    }
    existing = await payment(id);
  }
  if (
    !existing ||
    existing.donor !== record.owner ||
    existing.goalId !== record.goalId ||
    existing.amount !== amount.value
  )
    throw new Error("Subscription payment ownership mismatch.");
  if (existing.status === "CREATED")
    await completePayment(existing, sale.id, sale.time);
}

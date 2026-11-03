import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { database, requireTable } from "./aws.ts";
import "server-only";
import { z } from "zod";
import { paypalRequest } from "./paypal.ts";
import { subscriptionById } from "./subscriptionStore.ts";
import {
  refreshSubscription,
  syncSubscriptionPayments,
} from "./subscriptions.ts";
import { payment } from "./contributions.ts";
import { recordRefund } from "./payment-events.ts";
function refundCents(value: string) {
  const parts = value.split(".");
  if (
    parts.length > 2 ||
    !parts[0] ||
    (parts[1]?.length ?? 0) > 2 ||
    !parts.every(
      (part) =>
        part.length > 0 &&
        Array.from(part).every((char) => char >= "0" && char <= "9"),
    )
  )
    throw new Error("Invalid refund amount.");
  const cents =
    Number(parts[0]) * 100 + Number((parts[1] ?? "").padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents <= 0)
    throw new Error("Invalid refund amount.");
  return cents;
}
async function applyRefund(
  record: NonNullable<Awaited<ReturnType<typeof payment>>>,
  eventId: string,
  refundId: string,
  cents: number,
) {
  try {
    await recordRefund(record, eventId, refundId, cents);
  } catch (error) {
    const existing = await database.send(
      new GetCommand({
        TableName: requireTable(),
        Key: { pk: `REFUND#${refundId}`, sk: "META" },
        ConsistentRead: true,
      }),
    );
    if (existing.Item?.orderId !== record.id || existing.Item?.cents !== cents)
      throw error;
  }
}
const eventSchema = z.object({
  id: z.string(),
  event_type: z.string(),
  resource: z
    .object({ id: z.string(), billing_agreement_id: z.string().optional() })
    .passthrough(),
});
export async function handleSubscriptionWebhook(raw: unknown) {
  const event = eventSchema.parse(raw);
  const seen = await database.send(
    new GetCommand({
      TableName: requireTable(),
      Key: { pk: `EVENT#${event.id}`, sk: "META" },
      ConsistentRead: true,
    }),
  );
  if (seen.Item) return true;
  if (
    event.event_type.startsWith("BILLING.SUBSCRIPTION.") ||
    event.event_type === "PAYMENT.SALE.COMPLETED"
  ) {
    const id = event.event_type.startsWith("BILLING.SUBSCRIPTION.")
      ? event.resource.id
      : event.resource.billing_agreement_id;
    if (!id) return false;
    const record = await subscriptionById(id);
    if (!record) return true;
    const current = await refreshSubscription(record);
    if (current.status !== "APPROVAL_PENDING")
      await syncSubscriptionPayments(current);
    return true;
  }
  if (event.event_type === "PAYMENT.SALE.REFUNDED") {
    const refund = z
      .object({
        id: z.string(),
        sale_id: z.string(),
        state: z.string(),
        amount: z.object({ total: z.string(), currency: z.string() }),
      })
      .parse(
        await paypalRequest(
          `/v1/payments/refund/${encodeURIComponent(event.resource.id)}`,
        ),
      );
    const record = await payment(`subscription-${refund.sale_id}`);
    if (!record)
      throw new Error(
        "Subscription refund payment unavailable. Retry delivery.",
      );
    if (
      refund.id !== event.resource.id ||
      refund.state !== "completed" ||
      refund.amount.currency !== "USD"
    )
      throw new Error("Subscription refund rejected.");
    await applyRefund(
      record,
      event.id,
      refund.id,
      refundCents(refund.amount.total),
    );
    return true;
  }
  if (event.event_type === "PAYMENT.SALE.REVERSED") {
    const record = await payment(`subscription-${event.resource.id}`);
    if (!record)
      throw new Error(
        "Reversed subscription payment unavailable. Retry delivery.",
      );
    const remaining = record.cents - (record.refundedCents ?? 0);
    if (remaining > 0)
      await applyRefund(
        record,
        event.id,
        `reversal-${event.resource.id}`,
        remaining,
      );
    return true;
  }
  return false;
}

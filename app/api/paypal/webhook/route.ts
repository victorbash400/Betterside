import { z } from "zod";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { paypalRequest } from "../../../server/paypal";
import {
  completePayment,
  payment,
  changePaymentStatus,
} from "../../../server/contributions";
import { recordRefund } from "../../../server/payment-events";
import { database, requireTable } from "../../../server/aws";
import { apiError } from "../../../server/http";
const eventSchema = z.object({
  id: z.string(),
  event_type: z.string(),
  resource: z.object({
    id: z.string(),
    status: z.string().optional(),
    amount: z
      .object({ currency_code: z.string(), value: z.string() })
      .optional(),
    supplementary_data: z
      .object({ related_ids: z.object({ order_id: z.string().optional() }) })
      .optional(),
    links: z.array(z.object({ href: z.url(), rel: z.string() })).optional(),
  }),
});
export async function POST(request: Request) {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) throw new Error("Configure PAYPAL_WEBHOOK_ID.");
    const raw: unknown = await request.json();
    const verification = await paypalRequest(
      "/v1/notifications/verify-webhook-signature",
      {
        auth_algo: request.headers.get("paypal-auth-algo"),
        cert_url: request.headers.get("paypal-cert-url"),
        transmission_id: request.headers.get("paypal-transmission-id"),
        transmission_sig: request.headers.get("paypal-transmission-sig"),
        transmission_time: request.headers.get("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: raw,
      },
    );
    if (verification.verification_status !== "SUCCESS")
      return Response.json(
        { error: "Invalid PayPal signature." },
        { status: 401 },
      );
    const event = eventSchema.parse(raw);
    const seen = await database.send(
      new GetCommand({
        TableName: requireTable(),
        Key: { pk: `EVENT#${event.id}`, sk: "META" },
        ConsistentRead: true,
      }),
    );
    if (seen.Item) return Response.json({ received: true });
    let orderId = event.resource.supplementary_data?.related_ids.order_id;
    if (!orderId && event.event_type === "PAYMENT.CAPTURE.REFUNDED") {
      const link = event.resource.links?.find((link) => link.rel === "up");
      if (!link) throw new Error("Refund capture reference missing.");
      const url = new URL(link.href);
      const segments = url.pathname.split("/");
      if (
        url.hostname !== "api.sandbox.paypal.com" &&
        url.hostname !== "api-m.sandbox.paypal.com"
      )
        throw new Error("Refund reference rejected.");
      if (
        segments.length !== 5 ||
        segments[1] !== "v2" ||
        segments[2] !== "payments" ||
        segments[3] !== "captures"
      )
        throw new Error("Refund capture reference rejected.");
      const capture = await paypalRequest(
        `/v2/payments/captures/${encodeURIComponent(segments[4])}`,
      );
      orderId = z
        .object({
          supplementary_data: z.object({
            related_ids: z.object({ order_id: z.string() }),
          }),
        })
        .parse(capture).supplementary_data.related_ids.order_id;
    }
    if (!orderId) return Response.json({ received: true });
    const record = await payment(orderId);
    if (!record) throw new Error("Webhook contribution not found.");
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      if (
        event.resource.amount?.value !== record.amount ||
        event.resource.amount?.currency_code !== "USD" ||
        event.resource.status !== "COMPLETED"
      )
        throw new Error("Capture event does not match contribution.");
      await completePayment(record, event.resource.id);
    } else if (
      event.event_type === "PAYMENT.CAPTURE.DENIED" &&
      record.status === "CREATED"
    )
      await changePaymentStatus(record, "FAILED");
    else if (event.event_type === "PAYMENT.CAPTURE.REFUNDED") {
      const amount = event.resource.amount;
      if (!amount || amount.currency_code !== "USD")
        throw new Error("Refund amount rejected.");
      const cents = Math.round(Number(amount.value) * 100);
      if (!Number.isSafeInteger(cents) || cents <= 0 || cents > record.cents)
        throw new Error("Refund amount rejected.");
      try {
        await recordRefund(record, event.id, event.resource.id, cents);
      } catch (error) {
        const duplicate = await database.send(
          new GetCommand({
            TableName: requireTable(),
            Key: { pk: `REFUND#${event.resource.id}`, sk: "META" },
            ConsistentRead: true,
          }),
        );
        if (!duplicate.Item) throw error;
      }
    }
    return Response.json({ received: true });
  } catch (error) {
    return apiError(error, 503);
  }
}

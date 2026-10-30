import "server-only";
import { z } from "zod";
import { loadCatalogue } from "./catalogue.ts";
import { amountInCents, decimalAmount } from "../lib/payment.ts";
import { paypalRequest } from "./paypal.ts";
import { payment, recordPayment } from "./contributions.ts";
import { paymentResultSchema } from "../lib/chatWorkspace.ts";
export async function createPayPalOrder({
  projectId,
  amount: amountInput,
  donor,
  originUrl,
  requestId,
}: {
  projectId: string;
  amount: string;
  donor: string;
  originUrl: string;
  requestId: string;
}) {
  const issues = await loadCatalogue();
  const issue = issues.find((issue) => issue.project.id === projectId);
  if (!issue) throw new Error("Project not found.");
  const merchantId = process.env.PAYPAL_MERCHANT_ID;
  if (!merchantId) throw new Error("Configure PAYPAL_MERCHANT_ID.");
  const cents = amountInCents(amountInput),
    amount = decimalAmount(cents),
    origin = new URL(originUrl).origin;
  const data = await paypalRequest(
    "/v2/checkout/orders",
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: issue.project.id,
          payee: { merchant_id: merchantId },
          custom_id: issue.project.id,
          description: `BetterSide Sandbox: ${issue.project.name}`,
          amount: { currency_code: "USD", value: amount },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "BetterSide Sandbox",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: `${origin}/paypal/return`,
            cancel_url: `${origin}/paypal/cancel`,
          },
        },
      },
    },
    requestId,
  );
  const order = z
    .object({
      id: z.string(),
      links: z.array(z.object({ rel: z.string(), href: z.url() })),
    })
    .parse(data);
  const approvalUrl = order.links.find(
    (link) => link.rel === "payer-action" || link.rel === "approve",
  )?.href;
  if (
    !approvalUrl ||
    new URL(approvalUrl).hostname !== "www.sandbox.paypal.com"
  )
    throw new Error("PayPal approval URL rejected.");
  const existing = await payment(order.id);
  if (
    existing &&
    (existing.donor !== donor ||
      existing.projectId !== projectId ||
      existing.cents !== cents)
  )
    throw new Error("PayPal order does not match this request.");
  if (!existing)
    await recordPayment({
      id: order.id,
      donor,
      cents,
      amount,
      currency: "USD",
      projectId: issue.project.id,
      projectKey: issue.id,
      projectName: issue.project.name,
      recipient: merchantId,
      status: "CREATED",
      createdAt: new Date().toISOString(),
    });
  return paymentResultSchema.parse({
    kind: "payment",
    id: order.id,
    projectId: issue.project.id,
    projectName: issue.project.name,
    amount,
    currency: "USD",
    sandbox: true,
    approvalUrl,
  });
}

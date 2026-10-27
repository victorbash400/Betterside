import { z } from "zod";
import { paypalRequest } from "../../../server/paypal";
import { donorSession } from "../../../server/donor";
import { payment, completePayment } from "../../../server/contributions";
import { sameOrigin, apiError } from "../../../server/http";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { orderId } = z
      .object({ orderId: z.string().min(1).max(64) })
      .parse(await request.json());
    const donor = await donorSession();
    const record = await payment(orderId);
    if (!record || record.donor !== donor)
      return Response.json(
        { error: "Contribution not found." },
        { status: 404 },
      );
    if (record.status === "COMPLETED")
      return Response.json({
        status: record.status,
        amount: record.amount,
        projectName: record.projectName,
      });
    if (record.status !== "CREATED")
      throw new Error("Contribution cannot be captured.");
    const existing = await paypalRequest(
      `/v2/checkout/orders/${encodeURIComponent(orderId)}`,
    );
    if (existing.status !== "COMPLETED")
      await paypalRequest(
        `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
        {},
        `capture-${orderId}`,
      );
    const raw =
      existing.status === "COMPLETED"
        ? existing
        : await paypalRequest(
            `/v2/checkout/orders/${encodeURIComponent(orderId)}`,
          );
    const order = z
      .object({
        id: z.string(),
        status: z.string(),
        purchase_units: z.array(
          z.object({
            reference_id: z.string(),
            payee: z.object({ merchant_id: z.string() }),
            payments: z.object({
              captures: z.array(
                z.object({
                  id: z.string(),
                  status: z.string(),
                  amount: z.object({
                    currency_code: z.string(),
                    value: z.string(),
                  }),
                }),
              ),
            }),
          }),
        ),
      })
      .parse(raw);
    const unit = order.purchase_units[0],
      capture = unit?.payments.captures[0];
    if (
      order.id !== orderId ||
      order.status !== "COMPLETED" ||
      unit.reference_id !== record.projectId ||
      unit.payee.merchant_id !== record.recipient ||
      order.purchase_units.length !== 1 ||
      unit.payments.captures.length !== 1 ||
      capture?.status !== "COMPLETED" ||
      capture.amount.currency_code !== "USD" ||
      capture.amount.value !== record.amount
    )
      throw new Error("PayPal capture did not match the contribution.");
    await completePayment(record, capture.id);
    return Response.json({
      status: "COMPLETED",
      amount: record.amount,
      projectName: record.projectName,
    });
  } catch (error) {
    return apiError(error);
  }
}

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { donorSession } from "../../../server/donor";
import { createPayPalOrder } from "../../../server/createPayPalOrder";
import { payment } from "../../../server/contributions";
import { sameOrigin, apiError } from "../../../server/http";
import { paymentStatusSchema } from "../../../lib/chatWorkspace";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const input = z
      .object({
        projectId: z.string(),
        amount: z.string(),
        goalId: z.string().max(100).optional(),
      })
      .strict()
      .parse(await request.json());
    const donor = await donorSession();
    if (!donor) throw new Error("Could not create donor session.");
    return Response.json(
      await createPayPalOrder({
        ...input,
        donor,
        originUrl: request.url,
        requestId: randomUUID(),
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function GET(request: Request) {
  try {
    const id = z
      .string()
      .min(1)
      .max(160)
      .parse(new URL(request.url).searchParams.get("orderId"));
    const donor = await donorSession();
    const record = donor ? await payment(id) : undefined;
    if (!record || record.donor !== donor)
      return apiError(new Error("Order unavailable for this session."), 404);
    return Response.json(paymentStatusSchema.parse(record), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}

import { donorSession } from "../../../../server/donor";
import { sameOrigin, apiError } from "../../../../server/http";
import { setupSubscription } from "../../../../server/subscriptionSetup";
import { subscriptionSchema } from "../../../../lib/paypalSubscription";
export const maxDuration = 120;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const owner = await donorSession();
    if (!owner) throw new Error("Session unavailable. Return to BetterSide.");
    const record = await setupSubscription(
      owner,
      await request.json(),
      new URL(request.url).origin,
    );
    return Response.json(
      { subscription: subscriptionSchema.parse(record) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "ConditionalCheckFailedException",
        "TransactionCanceledException",
      ].includes(error.name)
    )
      return apiError(
        new Error("Subscription changed. Refresh Goals and retry."),
        409,
      );
    return apiError(error, 400);
  }
}

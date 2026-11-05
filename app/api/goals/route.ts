import { donorSession } from "../../server/donor";
import { loadProfile } from "../../server/profile";
import { contributions } from "../../server/contributions";
import { donorSubscriptions } from "../../server/subscriptionStore";
import { goalsSnapshotSchema } from "../../lib/goalsSnapshot";
import { apiError } from "../../server/http";

export async function GET() {
  try {
    const owner = await donorSession();
    const [profile, ledger, subscriptions] = await Promise.all([
      loadProfile(owner),
      contributions(owner),
      donorSubscriptions(owner),
    ]);
    return Response.json(
      goalsSnapshotSchema.parse({
        ...profile,
        contributions: ledger,
        subscriptions,
      }),
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return apiError(error, 503);
  }
}

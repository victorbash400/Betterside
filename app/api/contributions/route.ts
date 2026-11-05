import { donorSession } from "../../server/donor";
import { contributions } from "../../server/contributions";
import { apiError, sameOrigin } from "../../server/http";
import { reconcileDonorSubscriptions } from "../../server/subscriptions";
export const maxDuration = 120;
export async function GET() {
  try {
    const donor = await donorSession();
    return Response.json(
      { contributions: donor ? await contributions(donor) : [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error, 503);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const donor = await donorSession();
    await reconcileDonorSubscriptions(donor);
    return Response.json(
      { contributions: await contributions(donor) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error, 503);
  }
}

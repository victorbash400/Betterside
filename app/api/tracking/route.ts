import { z } from "zod";
import { donorSession } from "../../server/donor";
import { loadTracking, saveTracking } from "../../server/tracking";
import { trackingSchema } from "../../lib/tracking";
import { apiError, sameOrigin } from "../../server/http";
export async function GET() {
  try {
    const donor = await donorSession();
    if (!donor) throw new Error("Visitor session unavailable.");
    return Response.json(await loadTracking(donor), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error, 503);
  }
}
export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    const donor = await donorSession();
    if (!donor)
      return apiError(new Error("Visitor session expired. Reload."), 401);
    const body = await request.text();
    if (body.length > 128000)
      return apiError(new Error("Too many tracked items."), 413);
    const input = z
      .object({
        snapshot: trackingSchema,
        revision: z.number().int().nonnegative(),
      })
      .parse(JSON.parse(body));
    return Response.json(
      await saveTracking(donor, input.snapshot, input.revision),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "ConditionalCheckFailedException"
    )
      return apiError(
        new Error("Interests changed in another tab. Reload to review."),
        409,
      );
    return apiError(error, 503);
  }
}

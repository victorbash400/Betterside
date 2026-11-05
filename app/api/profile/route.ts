import { z } from "zod";
import { donorSession } from "../../server/donor";
import { loadProfile, saveProfile } from "../../server/profile";
import { profileSchema } from "../../lib/profile";
import { apiError, sameOrigin } from "../../server/http";
export async function GET() {
  try {
    const donor = await donorSession();
    if (!donor) throw new Error("Profile session unavailable.");
    return Response.json(await loadProfile(donor), {
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
      return apiError(new Error("Profile session expired. Reload."), 401);
    const body = await request.text();
    if (body.length > 16000)
      return apiError(new Error("Profile too large."), 413);
    const input = z
      .object({
        profile: profileSchema,
        revision: z.number().int().nonnegative(),
      })
      .strict()
      .parse(JSON.parse(body));
    return Response.json(
      await saveProfile(donor, input.profile, input.revision),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (failure) {
    return apiError(
      failure instanceof Error &&
        failure.name === "ConditionalCheckFailedException"
        ? new Error("Profile changed in another tab. Reload to review.")
        : failure,
    );
  }
}

import { donorSession } from "../../server/donor";
import { contributions } from "../../server/contributions";
import { apiError } from "../../server/http";
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

import { loadNaturalEvents } from "../../server/naturalEvents";
import { apiError } from "../../server/http";
export async function GET() {
  try {
    return Response.json({ issues: await loadNaturalEvents() });
  } catch {
    return apiError(new Error("NASA EONET unavailable. Retry."), 503);
  }
}

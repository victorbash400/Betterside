import { cachedResponse } from "../../server/cachedResponse";
import { loadDiscovery } from "../../server/discovery";
import { apiError } from "../../server/http";
export const maxDuration = 120;
export async function GET(request: Request) {
  try {
    const result = await loadDiscovery();
    const available = result.sources.some(
      (source) =>
        source.state === "ready" ||
        source.state === "partial" ||
        source.state === "stale",
    );
    if (available) {
      const deadlines = result.sources.flatMap((source) =>
        source.expiresAt || source.retryAt
          ? [Date.parse((source.expiresAt ?? source.retryAt)!)]
          : [],
      );
      const maxAge = Math.max(
        0,
        Math.min(
          60,
          ...deadlines.map((deadline) =>
            Math.floor((deadline - Date.now()) / 1000),
          ),
        ),
      );
      return cachedResponse(request, result, maxAge);
    }
    return Response.json(
      {
        ...result,
        error: "All event sources unavailable. Retry.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return apiError(new Error("Discovery data unavailable. Retry."), 503);
  }
}

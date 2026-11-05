import { trendScopeSchema } from "../../lib/trends";
import { loadTrends } from "../../server/trends";
import { cachedResponse } from "../../server/cachedResponse";
export const maxDuration = 120;
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const parsed = trendScopeSchema.safeParse({
    countries: query.get("countries")?.split(","),
    concern: query.get("concern") ?? undefined,
    dataset: query.get("dataset") ?? undefined,
    recordId: query.get("recordId") ?? undefined,
    seriesLabel: query.get("seriesLabel") ?? undefined,
  });
  if (!parsed.success)
    return Response.json(
      { error: "Select up to four countries." },
      { status: 400 },
    );
  try {
    const result = await loadTrends(parsed.data);
    return cachedResponse(
      request,
      result.value,
      result.value.failures.length ? 120 : 6 * 60 * 60,
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "History unavailable. Retry.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

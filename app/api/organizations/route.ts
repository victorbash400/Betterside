import { createHash } from "node:crypto";
import { createAsyncCache } from "../../lib/asyncCache";
import { cacheLifetimes } from "../../lib/feedCachePolicy";
import { cachedResponse } from "../../server/cachedResponse";
import { organizationsResponseSchema } from "../../lib/responseOrganizations";
import { z } from "zod";
import { concerns } from "../../lib/concerns";
import {
  groupOrganizations,
  presenceSchema,
  responseSectors,
} from "../../lib/responseOrganizations";
import { hapiPages, loadHapiResources } from "../../server/feeds/hapi";
import { apiError } from "../../server/http";
export const maxDuration = 120;
const cache = createAsyncCache<z.infer<typeof organizationsResponseSchema>>({
  maxEntries: 128,
  maxBytes: 8 * 1024 * 1024,
});
const querySchema = z.object({
  country: z
    .string()
    .length(3)
    .refine((value) =>
      [...value].every((letter) =>
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(letter),
      ),
    ),
  concern: z.enum([...concerns.map((concern) => concern.id), "all"]),
});
export async function GET(request: Request) {
  const query = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!query.success)
    return apiError(new Error("Invalid organization lookup."));
  try {
    const { country, concern } = query.data;
    const sector = concern === "all" ? undefined : responseSectors[concern];
    const identifier = createHash("sha256")
      .update(process.env.HDX_HAPI_APP_IDENTIFIER ?? "")
      .digest("hex");
    const cached = await cache.get(
      JSON.stringify([country, sector?.code ?? "all", identifier]),
      async () => {
        const parameters: Record<string, string> = { location_code: country };
        if (sector) parameters.sector_code = sector.code;
        const [feed, resources] = await Promise.all([
          hapiPages(
            "coordination-context/operational-presence",
            parameters,
            cacheLifetimes.organizations,
            (raw) => presenceSchema.parse(raw),
          ),
          loadHapiResources(),
        ]);
        const rows = presenceSchema.parse(feed).data;
        return organizationsResponseSchema.parse({
          country: rows[0]?.location_name ?? country,
          sector: sector?.name ?? "All sectors",
          truncated: feed.truncated,
          organizations: groupOrganizations(
            feed,
            resources,
            country,
            sector?.code,
          ),
        });
      },
      {
        ttlMs: (value) =>
          value.truncated
            ? cacheLifetimes.failure
            : cacheLifetimes.organizations,
        errorTtlMs: cacheLifetimes.failure,
      },
    );
    const maxAge = Math.max(
      0,
      Math.min(3600, Math.floor((cached.expiresAt - Date.now()) / 1000)),
    );
    return cachedResponse(
      request,
      {
        ...cached.value,
        fetchedAt: new Date(cached.storedAt).toISOString(),
        expiresAt: new Date(cached.expiresAt).toISOString(),
      },
      maxAge,
    );
  } catch (error) {
    const response = apiError(error, 503);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}

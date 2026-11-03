import { createAsyncCache } from "../lib/asyncCache.ts";
import { cacheLifetimes } from "../lib/feedCachePolicy.ts";
import { organizationsResponseSchema } from "../lib/responseOrganizations.ts";
import type { z } from "zod";
export type ResponseOrganizationsData = z.infer<typeof organizationsResponseSchema>;
const cache = createAsyncCache<ResponseOrganizationsData>({
  maxEntries: 64,
  maxBytes: 16 * 1024 * 1024,
});
export function responseOrganizationsPath(country: string, concern: string) {
  return `/api/organizations?${new URLSearchParams({ country, concern })}`;
}
export function cachedResponseOrganizations(path: string) {
  return cache.peek(path)?.value;
}
export async function fetchResponseOrganizations(path: string, refresh = false) {
  if (refresh) cache.invalidate(path);
  const result = await cache.get(path, async () => {
    const response = await fetch(path, { cache: refresh ? "reload" : "default" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Organization lookup failed. Retry.");
    return organizationsResponseSchema.parse(data);
  }, {
    ttlMs: (value) => value.truncated ? cacheLifetimes.failure : cacheLifetimes.organizations,
    errorTtlMs: cacheLifetimes.failure,
  });
  return result.value;
}

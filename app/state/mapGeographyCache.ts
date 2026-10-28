import { createAsyncCache } from "../lib/asyncCache";
import { cacheLifetimes } from "../lib/feedCachePolicy";
import { mapGeographySchema, type MapGeography } from "../lib/mapGeography";
const cache = createAsyncCache<MapGeography>({
  maxEntries: 1,
  maxBytes: 8 * 1024 * 1024,
});
export async function loadMapGeography() {
  const result = await cache.get(
    "map-geography",
    async () => {
      const response = await fetch("/geography/areas.json");
      if (!response.ok) throw new Error("Map boundaries unavailable. Retry.");
      return mapGeographySchema.parse(await response.json());
    },
    { ttlMs: cacheLifetimes.geography, errorTtlMs: 0 },
  );
  return result.value;
}

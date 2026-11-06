import "server-only";
import { CachedLoadError, createAsyncCache } from "../lib/asyncCache";
import { cacheLifetimes } from "../lib/feedCachePolicy";
import {
  buildTrendSeries,
  trendScopeSchema,
  trendDatasets,
  type TrendScope,
  type TrendsResponse,
} from "../lib/trends";
import { loadCountries } from "./feeds/geography";
import { loadHapi, loadHapiResources } from "./feeds/hapi";

const cache = createAsyncCache<TrendsResponse>({
  maxEntries: 48,
  maxBytes: 32 * 1024 * 1024,
});
export async function loadTrends(scope: TrendScope) {
  scope = trendScopeSchema.parse(scope);
  const seriesLabel = scope.seriesLabel?.toLowerCase();
  const normalized = {
    ...scope,
    countries: [...new Set(scope.countries)].sort(),
  };
  return cache.get(
    JSON.stringify(normalized),
    async () => {
      const datasets = trendDatasets(scope);
      const fetchedAt = new Date().toISOString();
      if (!datasets.length) return { series: [], failures: [], fetchedAt };
      const [countries, resources] = await Promise.all([
        loadCountries(),
        loadHapiResources(),
      ]);
      for (const code of normalized.countries)
        if (
          !countries.some(
            (country) =>
              country.iso3 === code &&
              !country.is_deprecated &&
              country.record_type === 1,
          )
        )
          throw new Error(`Unknown country: ${code}.`);
      const requests = normalized.countries.flatMap((countryCode) =>
        datasets.map((dataset) => ({ countryCode, dataset })),
      );
      const results = await Promise.allSettled(
        requests.map(async ({ countryCode, dataset }) => {
          const result = await loadHapi(
            dataset,
            countries,
            resources,
            fetchedAt,
            { countryCode, years: 5 },
          );
          if (result.truncated)
            throw new Error(
              "History exceeds source limit. Select a narrower scope.",
            );
          if (result.skipped)
            throw new Error(
              "History contains unresolved geography or sources.",
            );
          return buildTrendSeries(result.issues, scope.concern).filter(
            (series) =>
              scope.recordId ? series.recordId === scope.recordId : (!seriesLabel ||
                series.label.toLowerCase() === seriesLabel ||
                series.label.toLowerCase() === `${series.country.toLowerCase()} · ${seriesLabel}`),
          );
        }),
      );
      const series: TrendsResponse["series"] = [],
        failures: TrendsResponse["failures"] = [];
      results.forEach((result, index) => {
        if (result.status === "fulfilled") series.push(...result.value);
        else
          failures.push({
            ...requests[index],
            ...(result.reason instanceof CachedLoadError
              ? { retryAt: new Date(result.reason.retryAt).toISOString() } : {}),
            error:
              result.reason instanceof Error
                ? result.reason.message
                : "History unavailable. Retry.",
          });
      });
      return { series, failures, fetchedAt };
    },
    {
      ttlMs: (result) =>
        result.failures.length
          ? Math.max(1, Math.min(...result.failures.map((failure) => failure.retryAt
            ? new Date(failure.retryAt).getTime() - Date.now() : cacheLifetimes.failure)))
          : cacheLifetimes.metadata,
      errorTtlMs: cacheLifetimes.failure,
    },
  );
}

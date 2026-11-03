import { useEffect, useRef, useState } from "react";
import { createAsyncCache } from "../lib/asyncCache";
import {
  trendsResponseSchema,
  type TrendsResponse,
  type TrendScope,
} from "../lib/trends";
const cache = createAsyncCache<TrendsResponse>({
  maxEntries: 32,
  maxBytes: 24 * 1024 * 1024,
});
function trendPath(scope: TrendScope) {
  const query = new URLSearchParams({
    countries: [...new Set(scope.countries)].sort().join(","),
  });
  if (scope.concern) query.set("concern", scope.concern);
  if (scope.dataset) query.set("dataset", scope.dataset);
  if (scope.recordId) query.set("recordId", scope.recordId);
  return `/api/trends?${query}`;
}
export async function fetchTrends(scope: TrendScope, refresh = false) {
  const path = trendPath(scope);
  if (refresh) cache.invalidate(path);
  return cache.get(
    path,
    async () => {
      const response = await fetch(path, { cache: refresh ? "reload" : "default" });
      const raw: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          raw &&
            typeof raw === "object" &&
            "error" in raw &&
            typeof raw.error === "string"
            ? raw.error
            : "History unavailable. Retry.",
        );
      return trendsResponseSchema.parse(raw);
    },
    {
      ttlMs: (result) => (result.failures.length ? 120_000 : 6 * 60 * 60_000),
      errorTtlMs: 0,
    },
  );
}
export function useTrends(scopes: TrendScope[], enabled = true) {
  function cachedResult(): TrendsResponse | undefined {
    const results = scopes.map((scope) => cache.peek(trendPath(scope)));
    if (results.some((result) => !result)) return undefined;
    return combineResults(results.map((result) => result!.value));
  }
  const [result, setResult] = useState<TrendsResponse | undefined>(cachedResult);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(enabled && !result);
  const [revision, setRevision] = useState(0);
  const previousRevision = useRef(revision);
  const key = JSON.stringify(scopes);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const refresh = revision > previousRevision.current;
    previousRevision.current = revision;
    const saved = cachedResult();
    setBusy(!saved);
    setError("");
    setResult(saved);
    const requested = JSON.parse(key) as TrendScope[];
    void Promise.all(requested.map((scope) => fetchTrends(scope, refresh)))
      .then((results) => {
        if (!active) return;
        setResult(combineResults(results.map((result) => result.value)));
      })
      .catch((error) => {
        if (active)
          setError(
            error instanceof Error
              ? error.message
              : "History unavailable. Retry.",
          );
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [key, enabled, revision]);
  return {
    result,
    error,
    busy,
    retry: () => setRevision((value) => value + 1),
  };
}

function combineResults(results: TrendsResponse[]): TrendsResponse {
  return {
    series: [...new Map(results.flatMap((result) => result.series).map((series) => [series.id, series])).values()],
    failures: results.flatMap((result) => result.failures),
    fetchedAt: results[0]?.fetchedAt ?? new Date().toISOString(),
  };
}

import "server-only";
import ucdpSnapshot from "../data/ucdpEvents.json";
import { ucdpEvents } from "../lib/feeds/ucdp";
import { createHash } from "node:crypto";
import { createAsyncCache, CachedLoadError } from "../lib/asyncCache";
import { cacheLifetimes, sourceTtl } from "../lib/feedCachePolicy";
import { ZodError } from "zod";
import { dataSources, type FeedStatus } from "../lib/dataSources";
import { feedResultStatus } from "../lib/feedStatus";
import { deduplicateRecords } from "../lib/feeds/deduplicate";
import type { MapItem } from "../lib/types";
import { usgsEvents, usgsSchema } from "../lib/feeds/usgs";
import type { HapiDataset } from "../lib/feeds/hapi";
import { loadNaturalEvents } from "./naturalEvents";
import { loadCountries } from "./feeds/geography";
import { loadGdacs, loadIfrc } from "./feeds/disasters";
import { loadHapi, loadHapiResources } from "./feeds/hapi";
import { feedJson } from "./feeds/request";
type FeedResult = {
  issues: MapItem[];
  skipped: number;
  truncated: boolean;
  warnings?: number;
  message?: string;
};
const feeds = createAsyncCache<{ issues: MapItem[]; status: FeedStatus }>({
  maxEntries: 32,
  maxBytes: 48 * 1024 * 1024,
});
const configurationCheckedAt = new Date().toISOString();
export async function loadDiscovery() {
  const fetchedAt = new Date().toISOString();
  let countryRequest: ReturnType<typeof loadCountries> | undefined;
  let resourceRequest: ReturnType<typeof loadHapiResources> | undefined;
  const countries = () => (countryRequest ??= loadCountries());
  const resources = () => (resourceRequest ??= loadHapiResources());
  const identifier = createHash("sha256")
    .update(process.env.HDX_HAPI_APP_IDENTIFIER ?? "")
    .digest("hex");
  const results = await Promise.all(
    dataSources
      .filter((source) => source.id !== "catalogue")
      .map(async ({ id, label }) => {
        const status: FeedStatus = { id, state: "ready", count: 0, fetchedAt };
        if (id.startsWith("hapi-") && !process.env.HDX_HAPI_APP_IDENTIFIER) {
          return {
            issues: [] as MapItem[],
            status: {
              ...status,
              state: "unconfigured" as const,
              fetchedAt: configurationCheckedAt,
              message: `${label}: set HDX_HAPI_APP_IDENTIFIER.`,
            },
          };
        }
        try {
          const cached = await feeds.get(
            JSON.stringify([
              id,
              id.startsWith("hapi-") ? identifier : "public",
            ]),
            async () => {
              const fetchedAt = new Date().toISOString();
              const status: FeedStatus = {
                id,
                state: "ready",
                count: 0,
                fetchedAt,
              };
              let result: FeedResult;
              if (id === "ucdp")
                result = ucdpEvents(ucdpSnapshot, await countries());
              else if (id === "eonet") {
                const issues = await loadNaturalEvents();
                result = {
                  issues,
                  skipped: 0,
                  truncated: issues.length >= 1000,
                };
              } else if (id === "usgs") {
                result = {
                  issues: usgsEvents(
                    await feedJson(
                      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson",
                      undefined,
                      sourceTtl.usgs,
                      (raw) => usgsSchema.parse(raw),
                    ),
                    fetchedAt,
                  ),
                  skipped: 0,
                  truncated: false,
                };
              } else if (id === "gdacs") result = await loadGdacs(fetchedAt);
              else if (id === "ifrc")
                result = await loadIfrc(await countries(), fetchedAt);
              else {
                const [countryData, resourceData] = await Promise.all([
                  countries(),
                  resources(),
                ]);
                result = await loadHapi(
                  id as HapiDataset,
                  countryData,
                  resourceData,
                  fetchedAt,
                );
              }
              const issues = deduplicateRecords(result.issues);
              const completed = feedResultStatus(status, {
                ...result,
                count: issues.length,
              });
              if (result.warnings) {
                completed.state = "partial";
                completed.message = [completed.message, result.message]
                  .filter(Boolean)
                  .join(" ");
              }
              if (completed.state === "error")
                throw new Error(completed.message);
              return { issues, status: completed };
            },
            {
              ttlMs: (value) =>
                value.status.state === "partial"
                  ? cacheLifetimes.failure
                  : sourceTtl[id],
              errorTtlMs: cacheLifetimes.failure,
              staleIfErrorMs: 7 * 24 * 60 * 60 * 1000,
            },
          );
          return {
            ...cached.value,
            status: {
              ...cached.value.status,
              expiresAt: new Date(cached.expiresAt).toISOString(),
              ...(cached.refreshError
                ? {
                    state: "stale" as const,
                    retryAt: new Date(
                      cached.refreshError.retryAt,
                    ).toISOString(),
                    message: `${label}: cached records retained. ${cached.refreshError.message}`,
                  }
                : {}),
            },
          };
        } catch (error) {
          status.state = "error";
          if (error instanceof CachedLoadError) {
            status.fetchedAt = new Date(error.attemptedAt).toISOString();
            status.retryAt = new Date(error.retryAt).toISOString();
          }
          status.message = `${label}: ${error instanceof ZodError || (error instanceof CachedLoadError && error.cause instanceof ZodError) ? "Invalid source data. Retry." : error instanceof Error ? error.message : "Unavailable. Retry."}`;
          return { issues: [] as MapItem[], status };
        }
      }),
  );
  return {
    issues: results.flatMap((result) => result.issues),
    sources: results.map((result) => result.status),
    fetchedAt:
      results
        .map((result) => result.status.fetchedAt)
        .sort()
        .at(-1) ?? fetchedAt,
  };
}

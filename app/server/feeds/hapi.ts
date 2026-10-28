import "server-only";
import { z } from "zod";
import {
  hapiIndicators,
  hapiRowSchemas,
  resourceSchema,
  type HapiDataset,
  type HapiResource,
} from "../../lib/feeds/hapi";
import type { Country } from "../../lib/feeds/shared";
import { cacheLifetimes, sourceTtl } from "../../lib/feedCachePolicy";
import { feedJson } from "./request";
const endpoints = {
  "hapi-funding": "coordination-context/funding",
  "hapi-risk": "coordination-context/national-risk",
  "hapi-needs": "affected-people/humanitarian-needs",
  "hapi-food": "food-security-nutrition-poverty/food-security",
  "hapi-famine": "food-security-nutrition-poverty/food-security",
  "hapi-idps": "affected-people/idps",
  "hapi-refugees": "affected-people/refugees-persons-of-concern",
  "hapi-conflict": "coordination-context/conflict-events",
  "hapi-rainfall": "climate/rainfall",
};
export async function hapiPages(
  endpoint: string,
  parameters: Record<string, string>,
  ttlMs = cacheLifetimes.organizations,
  validate?: (value: unknown) => unknown,
) {
  const identifier = process.env.HDX_HAPI_APP_IDENTIFIER;
  if (!identifier) throw new Error("Set HDX_HAPI_APP_IDENTIFIER.");
  const data: unknown[] = [],
    limit = 10000;
  for (let page = 0; page < 5; page++) {
    const url = new URL(`https://hapi.humdata.org/api/v2/${endpoint}`);
    url.search = new URLSearchParams({
      ...parameters,
      limit: String(limit),
      offset: String(page * limit),
    }).toString();
    const result = z
      .object({ data: z.array(z.unknown()) })
      .parse(
        await feedJson(
          url,
          { "X-HDX-HAPI-APP-IDENTIFIER": identifier },
          ttlMs,
          validate,
        ),
      );
    data.push(...result.data);
    if (result.data.length < limit) return { data, truncated: false };
  }
  return { data, truncated: true };
}
export async function loadHapiResources() {
  const feed = await hapiPages(
    "metadata/resource",
    {},
    cacheLifetimes.metadata,
    (raw) => resourceSchema.parse(raw),
  );
  if (feed.truncated) throw new Error("HDX resource metadata incomplete.");
  return resourceSchema.parse(feed).data;
}
export async function loadHapi(
  dataset: HapiDataset,
  countries: Country[],
  resources: HapiResource[],
  reviewed: string,
) {
  const now = new Date(reviewed),
    start = new Date(now);
  start.setUTCDate(
    start.getUTCDate() -
      (dataset === "hapi-conflict"
        ? 90
        : dataset === "hapi-rainfall"
          ? 45
          : dataset === "hapi-refugees"
            ? 730
            : 365),
  );
  const parameters: Record<string, string> = {
    start_date: start.toISOString().slice(0, 10),
    end_date: reviewed.slice(0, 10),
  };
  if (!["hapi-refugees", "hapi-funding", "hapi-risk"].includes(dataset))
    parameters.admin_level = dataset === "hapi-rainfall" ? "1" : "0";
  if (dataset === "hapi-food")
    Object.assign(parameters, { ipc_type: "current", ipc_phase: "3+" });
  if (dataset === "hapi-famine")
    Object.assign(parameters, { ipc_type: "current", ipc_phase: "5" });
  if (dataset === "hapi-needs") parameters.population_status = "INN";
  if (dataset === "hapi-refugees")
    Object.assign(parameters, {
      gender: "all",
      age_range: "all",
      population_group: "REF",
    });
  if (dataset === "hapi-rainfall")
    Object.assign(parameters, {
      aggregation_period: "dekad",
      version: "final",
    });
  const validate = (raw: unknown) =>
    z.object({ data: z.array(hapiRowSchemas[dataset]) }).parse(raw);
  const feed = await hapiPages(
    endpoints[dataset],
    parameters,
    sourceTtl[dataset],
    validate,
  );
  if (dataset === "hapi-conflict") {
    // HAPI supplies high-conflict countries at admin 2, without national totals.
    const districts = await hapiPages(
      endpoints[dataset],
      {
        ...parameters,
        admin_level: "2",
        event_type: "political_violence",
      },
      sourceTtl[dataset],
      validate,
    );
    feed.data.push(...districts.data);
    feed.truncated ||= districts.truncated;
  }
  return {
    ...hapiIndicators(dataset, feed, countries, resources, reviewed),
    truncated: feed.truncated,
  };
}

import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import hapiSnapshot from "../data/hapiOrganizations.json";
import iatiSnapshot from "../data/iatiOrganizations.json";
import ftsSnapshot from "../data/ftsOrganizations.json";
import {
  ftsOrganizations,
  ftsOrganizationsSchema,
  ftsSourceUrl,
} from "../lib/ftsOrganizations";
import profiles from "../data/organizationProfiles.json";
import { createAsyncCache } from "../lib/asyncCache";
import { cacheLifetimes } from "../lib/feedCachePolicy";
import {
  directoryOrganizationSchema,
  mergeDirectoryOrganizations,
  organizationCountryOverview,
  type DirectoryOrganization,
  type OrganizationDirectory,
} from "../lib/organizations";
import {
  hapiOrganizationCatalogue,
  hapiOrganizationPresence,
  hapiOrganizationsSchema,
  iatiOrganizations,
  iatiOrganizationsSchema,
} from "../lib/organizationAdapters";
import { presenceSchema } from "../lib/responseOrganizations";
import { hapiPages, loadHapiResources } from "./feeds/hapi";
import { feedJson } from "./feeds/request";
const cache = createAsyncCache<{
  records: DirectoryOrganization[];
  truncated: boolean;
}>({ maxEntries: 128, maxBytes: 48 * 1024 * 1024 });
const reviewed = profiles.map((profile) =>
  directoryOrganizationSchema.parse(profile),
);
const profileNames = new Map(
  profiles.flatMap((profile) =>
    profile.aliases.map(
      (alias) => [alias.trim().toLocaleLowerCase(), profile.id] as const,
    ),
  ),
);
function linkProfiles(records: DirectoryOrganization[]) {
  return records.map((record) => {
    const id =
      profileNames.get(record.name.trim().toLocaleLowerCase()) ??
      profileNames.get(record.acronym.trim().toLocaleLowerCase());
    return id ? { ...record, id } : record;
  });
}
const snapshotOrganizations = mergeDirectoryOrganizations([
  ...reviewed,
  ...linkProfiles(ftsOrganizations(ftsSnapshot, ftsSnapshot.retrievedAt)),
  ...linkProfiles(iatiOrganizations(iatiSnapshot)),
  ...linkProfiles(
    hapiSnapshot.organizations.map((org) =>
      directoryOrganizationSchema.parse(org),
    ),
  ),
]);
async function buildOrganizationDirectory(
  country?: string,
  refresh = false,
): Promise<OrganizationDirectory> {
  const identifier = createHash("sha256")
    .update(process.env.HDX_HAPI_APP_IDENTIFIER ?? "")
    .digest("hex");
  const definitions = [
    {
      id: "fts",
      label: "OCHA FTS organizations",
      url: ftsSourceUrl,
      load: async () => {
        const raw = await feedJson(ftsSourceUrl, undefined, 86400000, (raw) =>
          ftsOrganizationsSchema.parse(raw),
        );
        return {
          records: ftsOrganizations(raw, new Date().toISOString()),
          truncated: false,
        };
      },
    },
    {
      id: "iati",
      label: "IATI publishers",
      url: "https://dashboard.iatistandard.org/api/reporting-orgs/",
      load: async () => {
        const raw = iatiOrganizationsSchema.parse(
          await feedJson(
            "https://dashboard.iatistandard.org/api/reporting-orgs/?format=json&page_size=10000",
            undefined,
            86400000,
            (data) => iatiOrganizationsSchema.parse(data),
          ),
        );
        return {
          records: iatiOrganizations(raw),
          truncated: Boolean(raw.next),
        };
      },
    },
    {
      id: "hapi-orgs",
      label: "OCHA organizations",
      url: "https://hapi.humdata.org/",
      load: async () => {
        const raw = await hapiPages("metadata/org", {}, 86400000, (data) =>
          hapiOrganizationsSchema.parse(data),
        );
        return {
          records: hapiOrganizationCatalogue(raw),
          truncated: raw.truncated,
        };
      },
    },
    {
      id: "hapi-presence",
      label: "OCHA operating areas",
      url: "https://data.humdata.org/",
      load: async () => {
        const [raw, resources] = await Promise.all([
          hapiPages(
            "coordination-context/operational-presence",
            country ? { location_code: country } : {},
            cacheLifetimes.organizations,
            (data) => presenceSchema.parse(data),
          ),
          loadHapiResources(),
        ]);
        return {
          records: hapiOrganizationPresence(raw, resources),
          truncated: raw.truncated,
        };
      },
    },
  ];
  const sources: OrganizationDirectory["sources"] = [
    {
      id: "profiles",
      label: "Reviewed official profiles",
      count: reviewed.length,
      state: "ready",
      url: null,
    },
  ];
  const results = await Promise.all(
    (refresh ? definitions : []).map(async (definition) => {
      if (
        definition.id.startsWith("hapi-") &&
        !process.env.HDX_HAPI_APP_IDENTIFIER
      )
        return {
          records: [] as DirectoryOrganization[],
          source: {
            id: definition.id,
            label: definition.label,
            count: 0,
            state: "unconfigured" as const,
            message: "Set HDX_HAPI_APP_IDENTIFIER.",
            url: definition.url,
          },
        };
      try {
        const result = await cache.get(
          JSON.stringify([
            definition.id,
            definition.id === "hapi-presence" ? (country ?? "all") : "all",
            identifier,
          ]),
          definition.load,
          {
            ttlMs:
              definition.id === "iati" || definition.id === "hapi-orgs"
                ? 86400000
                : cacheLifetimes.organizations,
            errorTtlMs: cacheLifetimes.failure,
          },
        );
        return {
          records: result.value.records,
          source: {
            id: definition.id,
            label: definition.label,
            count: new Set(result.value.records.map((record) => record.id))
              .size,
            state: result.value.truncated
              ? ("partial" as const)
              : ("ready" as const),
            url: definition.url,
            ...(result.value.truncated
              ? {
                  message:
                    "Page limit reached. Select a country for complete local coverage.",
                }
              : {}),
          },
        };
      } catch (error) {
        return {
          records: [] as DirectoryOrganization[],
          source: {
            id: definition.id,
            label: definition.label,
            count: 0,
            state: "error" as const,
            url: definition.url,
            message:
              error instanceof Error ? error.message : "Catalogue unavailable.",
          },
        };
      }
    }),
  );
  sources.push({
    id: "iati-snapshot",
    label: "IATI catalogue snapshot",
    count: iatiSnapshot.count,
    state: "ready",
    url: iatiSnapshot.source,
    message: `Retrieved ${iatiSnapshot.retrievedAt.slice(0, 10)}.`,
  });
  sources.push({
    id: "hapi-snapshot",
    label: "OCHA presence snapshot",
    count: hapiSnapshot.organizations.length,
    state: hapiSnapshot.truncated ? "partial" : "ready",
    url: hapiSnapshot.source,
    message: `Retrieved ${hapiSnapshot.retrievedAt.slice(0, 10)}. ${hapiSnapshot.records.toLocaleString("en")} presence records.`,
  });
  sources.push({
    id: "fts-snapshot",
    label: "OCHA FTS directory snapshot",
    count: ftsSnapshot.data.length,
    state: "ready",
    url: ftsSnapshot.source,
    message: `Retrieved ${ftsSnapshot.retrievedAt.slice(0, 10)}. Directory locations do not establish operating presence.`,
  });
  sources.push(...results.map((result) => result.source));
  return {
    organizations: mergeDirectoryOrganizations([
      ...snapshotOrganizations,
      ...linkProfiles(results.flatMap((result) => result.records)),
    ])
      .filter(
        (org) =>
          !country || org.presence.some((area) => area.countryCode === country),
      )
      .map((org) =>
        country
          ? {
              ...org,
              presence: [
                ...org.presence.filter((area) => area.countryCode === country),
                ...organizationCountryOverview(org).presence.filter(
                  (area) => area.countryCode !== country,
                ),
              ],
            }
          : organizationCountryOverview(org),
      ),
    sources,
    fetchedAt: new Date().toISOString(),
  };
}

const directories = createAsyncCache<OrganizationDirectory>({
  maxEntries: 32,
  maxBytes: 32 * 1024 * 1024,
});
export async function loadOrganizationDirectory(
  country?: string,
  refresh = false,
) {
  const identifier = createHash("sha256")
    .update(process.env.HDX_HAPI_APP_IDENTIFIER ?? "")
    .digest("hex");
  const key = JSON.stringify([country ?? "all", identifier]);
  if (refresh) directories.invalidate(key);
  const result = await directories.get(
    key,
    () => buildOrganizationDirectory(country, refresh),
    {
      ttlMs: (value) => value.sources.some((source) => source.state === "error" || source.state === "partial")
        ? cacheLifetimes.failure : cacheLifetimes.organizations,
      errorTtlMs: cacheLifetimes.failure,
    },
  );
  return result.value;
}

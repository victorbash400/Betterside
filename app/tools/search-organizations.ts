import "server-only";
import { tool } from "ai";
import { z } from "zod";
import {
  defaultOrganizationFilters,
  filterOrganizations,
  organizationTopics,
} from "../lib/organizations.ts";
import { loadOrganizationDirectory } from "../server/organizationDirectory.ts";
export const searchOrganizationsTool = tool({
  description:
    "Search source-reported organizations and operating countries. Returns an inline organization grid. Query is the literal organization name or acronym. Topics must use the named source categories. Country is a literal country name; not a headquarters filter. Does not claim impact or imply organizations receive BetterSide payments.",
  inputSchema: z.object({
    query: z.string().max(200).default(""),
    country: z.string().max(120).default(""),
    topics: z.array(z.enum(organizationTopics)).default([]),
    offset: z.number().int().min(0).max(20000).default(0),
  }),
  execute: async ({ query, country, topics, offset }) => {
    const directory = await loadOrganizationDirectory();
    const matches = filterOrganizations(directory.organizations, {
      ...defaultOrganizationFilters,
      query,
      topics,
    }).filter(
      (org) =>
        !country ||
        org.presence.some((area) =>
          area.country
            .toLocaleLowerCase()
            .includes(country.toLocaleLowerCase()),
        ),
    );
    return {
      kind: "organizations" as const,
      total: matches.length,
      organizations: matches.slice(offset, offset + 20),
      nextOffset: offset + 20 < matches.length ? offset + 20 : null,
    };
  },
});

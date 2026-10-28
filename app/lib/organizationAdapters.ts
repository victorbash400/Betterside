import { z } from "zod";
import { presenceSchema } from "./responseOrganizations.ts";
import type { HapiResource } from "./feeds/hapi.ts";
import {
  reportedOrganizationId,
  sectorTopics,
  type DirectoryOrganization,
} from "./organizations.ts";
export const iatiOrganizationsSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  results: z.array(
    z.object({
      id: z.string(),
      human_readable_name: z.string(),
      short_name: z.string(),
      organisation_identifier: z.string().nullable().optional(),
      organisation_type: z.string().nullable().optional(),
      website: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
    }),
  ),
});
export const hapiOrganizationsSchema = z.object({
  data: z.array(
    z.object({
      name: z.string(),
      acronym: z.string(),
      org_type_description: z.string().nullable(),
    }),
  ),
});
export function httpsUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
const iatiTypes: Record<string, string> = {
  "10": "Government",
  "11": "Local government",
  "15": "Other public sector",
  "21": "International NGO",
  "22": "National NGO",
  "23": "Regional NGO",
  "24": "Partner country NGO",
  "30": "Public private partnership",
  "40": "Multilateral",
  "60": "Foundation",
  "70": "Private sector",
  "71": "Private sector",
  "80": "Academic or research",
};
export function iatiOrganizations(raw: unknown): DirectoryOrganization[] {
  return iatiOrganizationsSchema.parse(raw).results.map((org) => ({
    id: `iati:${org.organisation_identifier || org.id}`,
    name: org.human_readable_name,
    acronym: "",
    type: iatiTypes[org.organisation_type ?? ""] ?? null,
    identifiers: [
      { scheme: "IATI", value: org.organisation_identifier || org.id },
    ],
    topics: [],
    description: org.description ? org.description.slice(0, 700) : null,
    website: httpsUrl(org.website),
    donateUrl: null,
    logoUrl: null,
    presence: [],
    size: null,
    evaluations: [],
    sources: [
      {
        label: "IATI publisher catalogue",
        url: "https://dashboard.iatistandard.org/api/reporting-orgs/?format=json&page_size=10000",
        date: null,
      },
    ],
  }));
}
export function hapiOrganizationCatalogue(
  raw: unknown,
): DirectoryOrganization[] {
  return hapiOrganizationsSchema.parse(raw).data.map((org) => ({
    id: reportedOrganizationId(org.name, org.acronym, org.org_type_description),
    name: org.name,
    acronym: org.acronym,
    type: org.org_type_description,
    identifiers: [],
    topics: [],
    description: null,
    website: null,
    donateUrl: null,
    logoUrl: null,
    presence: [],
    size: null,
    evaluations: [],
    sources: [
      {
        label: "OCHA organization catalogue",
        url: "https://hapi.humdata.org/",
        date: null,
      },
    ],
  }));
}
export function hapiOrganizationPresence(
  raw: unknown,
  resources: HapiResource[],
): DirectoryOrganization[] {
  const metadata = new Map(
    resources.map((resource) => [resource.resource_hdx_id, resource]),
  );
  return presenceSchema.parse(raw).data.map((row) => {
    const resource = metadata.get(row.resource_hdx_id);
    if (!resource) throw new Error("Organization source metadata unavailable.");
    const evidence = {
      label: resource.dataset_hdx_provider_name,
      url: resource.hdx_link,
      date: resource.update_date,
    };
    const org = hapiOrganizationCatalogue({
      data: [
        {
          name: row.org_name,
          acronym: row.org_acronym,
          org_type_description: row.org_type_description,
        },
      ],
    })[0];
    return {
      ...org,
      topics: sectorTopics[row.sector_code] ?? [],
      sources: [evidence],
      presence: [
        {
          countryCode: row.location_code,
          country: row.location_name,
          region:
            [row.admin2_name, row.admin1_name].filter(Boolean).join(", ") ||
            null,
          areaCode: row.admin2_code ?? row.admin1_code,
          sectors: [row.sector_name],
          start: row.reference_period_start,
          end: row.reference_period_end,
          evidence,
        },
      ],
    };
  });
}

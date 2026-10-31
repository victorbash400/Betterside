import { z } from "zod";
import type { DirectoryOrganization } from "./organizations.ts";
export const ftsSourceUrl = "https://api.hpc.tools/v1/public/organization";
export const ftsOrganizationsSchema = z.object({
  status: z.literal("ok"),
  data: z.array(
    z.object({
      id: z.number().int(),
      name: z.string().min(1),
      abbreviation: z.string().nullable().optional(),
      categories: z
        .array(z.object({ name: z.string(), group: z.string() }))
        .default([]),
      locations: z
        .array(
          z.object({
            name: z.string(),
            pcode: z.string().nullable().optional(),
            adminLevel: z.number().int(),
          }),
        )
        .default([]),
    }),
  ),
});
export function ftsOrganizations(
  raw: unknown,
  retrievedAt: string,
): DirectoryOrganization[] {
  return ftsOrganizationsSchema.parse(raw).data.map((org) => ({
    id: `fts:${org.id}`,
    name: org.name,
    acronym: org.abbreviation ?? "",
    type:
      org.categories.find((category) => category.group === "organizationType")
        ?.name ?? null,
    identifiers: [{ scheme: "OCHA FTS", value: String(org.id) }],
    topics: [],
    description: null,
    website: null,
    donateUrl: null,
    logoUrl: null,
    presence: [],
    size: null,
    evaluations: [],
    directoryLocations: org.locations.map((location) => ({
      name: location.name,
      code: location.pcode ?? null,
      adminLevel: location.adminLevel,
    })),
    sources: [
      {
        label: "OCHA FTS organization directory",
        url: ftsSourceUrl,
        date: retrievedAt,
      },
    ],
  }));
}

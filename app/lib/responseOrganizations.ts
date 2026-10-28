import { z } from "zod";
import type { ConcernId } from "./concerns.ts";
import type { HapiResource } from "./feeds/hapi.ts";
import { feedDate } from "./feeds/shared.ts";
export const responseSectors: Partial<
  Record<ConcernId, { code: string; name: string }>
> = {
  war: { code: "PRO", name: "Protection" },
  disease: { code: "HEA", name: "Health" },
  health: { code: "HEA", name: "Health" },
  hunger: { code: "FSC", name: "Food security" },
  famine: { code: "FSC", name: "Food security" },
  water: { code: "WSH", name: "Water, sanitation and hygiene" },
  displacement: { code: "PRO", name: "Protection" },
  refugees: { code: "PRO", name: "Protection" },
  shelter: { code: "SHL", name: "Shelter" },
};
export const presenceSchema = z.object({
  data: z.array(
    z.object({
      location_code: z.string(),
      location_name: z.string(),
      admin1_code: z.string().nullable(),
      admin1_name: z.string().nullable(),
      admin2_code: z.string().nullable(),
      admin2_name: z.string().nullable(),
      admin_level: z.number(),
      resource_hdx_id: z.string(),
      org_acronym: z.string(),
      org_name: z.string(),
      org_type_description: z.string().nullable(),
      sector_code: z.string(),
      sector_name: z.string(),
      reference_period_start: feedDate,
      reference_period_end: feedDate.nullable(),
    }),
  ),
});
export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  acronym: z.string(),
  type: z.string().nullable(),
  sectors: z.array(z.string()),
  areas: z.number(),
  locations: z.array(z.string()).default([]),
  start: z.string(),
  end: z.string().nullable(),
  sources: z.array(z.object({ url: z.url(), updated: z.string() })),
});
export const organizationsResponseSchema = z.object({
  country: z.string(),
  sector: z.string(),
  truncated: z.boolean(),
  organizations: z.array(organizationSchema),
});
export type ResponseOrganization = z.infer<typeof organizationSchema>;
export function groupOrganizations(
  raw: unknown,
  resources: HapiResource[],
  country: string,
  sector?: string,
) {
  const rows = presenceSchema
    .parse(raw)
    .data.filter(
      (row) =>
        row.location_code === country &&
        (!sector || row.sector_code === sector),
    );
  const metadata = new Map(
    resources.map((resource) => [resource.resource_hdx_id, resource]),
  );
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const id = JSON.stringify([
      row.org_name,
      row.org_acronym,
      row.org_type_description,
    ]);
    const group = groups.get(id) ?? [];
    group.push(row);
    groups.set(id, group);
  }
  const organizations: ResponseOrganization[] = [];
  for (const [id, group] of groups) {
    const latest = group.reduce(
      (date, row) =>
        row.reference_period_start > date ? row.reference_period_start : date,
      "",
    );
    const current = group.filter(
      (row) => row.reference_period_start === latest,
    );
    const first = current[0];
    const sources = current.map((row) => {
      const resource = metadata.get(row.resource_hdx_id);
      if (!resource)
        throw new Error("Organization source metadata unavailable. Retry.");
      return { url: resource.hdx_link, updated: resource.update_date };
    });
    organizations.push({
      id,
      name: first.org_name,
      acronym: first.org_acronym,
      type: first.org_type_description,
      sectors: [...new Set(current.map((row) => row.sector_name))].sort(),
      areas: new Set(
        current.map((row) =>
          JSON.stringify([
            row.admin1_code,
            row.admin1_name,
            row.admin2_code,
            row.admin2_name,
          ]),
        ),
      ).size,
      locations: [
        ...new Set(
          current.map((row) =>
            [row.admin2_name, row.admin1_name, row.location_name]
              .filter(Boolean)
              .join(", "),
          ),
        ),
      ].sort(),
      start: latest,
      end: current.some((row) => row.reference_period_end === null)
        ? null
        : current
            .map((row) => row.reference_period_end!)
            .sort()
            .at(-1)!,
      sources: [
        ...new Map(sources.map((source) => [source.url, source])).values(),
      ],
    });
  }
  return organizations.sort((a, b) => a.name.localeCompare(b.name));
}

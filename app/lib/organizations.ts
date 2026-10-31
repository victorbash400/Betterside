import { z } from "zod";
export const organizationTopics = [
  "Women's rights",
  "Health",
  "Hunger",
  "Water",
  "Refugees",
  "Shelter",
  "Camp management",
  "Conflict response",
  "Children",
  "Education",
  "Climate",
  "Human rights",
  "Poverty",
  "Disaster response",
] as const;
export type OrganizationTopic = (typeof organizationTopics)[number];
const safeUrl = z
  .url()
  .refine(
    (value) => new URL(value).protocol === "https:",
    "HTTPS URL required.",
  );
export const organizationEvidenceSchema = z.object({
  label: z.string(),
  url: safeUrl,
  date: z.string().nullable(),
});
export const organizationPresenceSchema = z.object({
  countryCode: z.string(),
  country: z.string(),
  region: z.string().nullable(),
  areaCode: z.string().nullable(),
  sectors: z.array(z.string()),
  start: z.string().nullable(),
  end: z.string().nullable(),
  evidence: organizationEvidenceSchema,
});
export const directoryOrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  acronym: z.string(),
  type: z.string().nullable(),
  identifiers: z.array(z.object({ scheme: z.string(), value: z.string() })),
  topics: z.array(z.string()),
  description: z.string().nullable(),
  website: safeUrl.nullable(),
  donateUrl: safeUrl.nullable(),
  logoUrl: safeUrl.nullable(),
  logoTone: z.enum(["light", "standard"]).optional(),
  presence: z.array(organizationPresenceSchema),
  directoryLocations: z
    .array(
      z.object({
        name: z.string(),
        code: z.string().nullable(),
        adminLevel: z.number().int(),
      }),
    )
    .optional(),
  size: z
    .object({
      label: z.string(),
      value: z.string(),
      evidence: organizationEvidenceSchema,
    })
    .nullable(),
  evaluations: z.array(organizationEvidenceSchema),
  sources: z.array(organizationEvidenceSchema),
});
export type DirectoryOrganization = z.infer<typeof directoryOrganizationSchema>;
export type OrganizationPresence = z.infer<typeof organizationPresenceSchema>;
export const organizationDirectorySchema = z.object({
  organizations: z.array(directoryOrganizationSchema),
  sources: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      count: z.number(),
      state: z.enum(["ready", "partial", "error", "unconfigured"]),
      message: z.string().optional(),
      url: safeUrl.nullable(),
    }),
  ),
  fetchedAt: z.string(),
});
export type OrganizationDirectory = z.infer<typeof organizationDirectorySchema>;
export interface OrganizationFilters {
  query: string;
  country: string;
  topics: string[];
  sector: string;
  type: string;
  donation: string;
}
export const defaultOrganizationFilters: OrganizationFilters = {
  query: "",
  country: "",
  topics: [],
  sector: "",
  type: "",
  donation: "",
};
export function filterOrganizations(
  organizations: DirectoryOrganization[],
  filters: OrganizationFilters,
) {
  const query = filters.query.trim().toLocaleLowerCase();
  return organizations.filter(
    (org) =>
      (!query ||
        [org.name, org.acronym, org.description ?? "", ...org.topics].some(
          (value) => value.toLocaleLowerCase().includes(query),
        )) &&
      (!filters.country ||
        org.presence.some((area) => area.country === filters.country)) &&
      (!filters.topics.length ||
        filters.topics.some((topic) => org.topics.includes(topic))) &&
      (!filters.sector ||
        org.presence.some(
          (area) =>
            (!filters.country || area.country === filters.country) &&
            area.sectors.includes(filters.sector),
        )) &&
      (!filters.type || org.type === filters.type) &&
      (!filters.donation || Boolean(org.donateUrl)),
  );
}
export function organizationCauseTopics(organization?: DirectoryOrganization) {
  return [...new Set(organization ? organization.topics : organizationTopics)];
}
export function organizationMapScope(
  organizations: DirectoryOrganization[],
  selected?: DirectoryOrganization,
  country?: string,
) {
  if (selected) return [selected];
  return country
    ? organizations.map((org) => ({
        ...org,
        presence: org.presence.filter((area) => area.countryCode === country),
      }))
    : organizations;
}
export function reportedOrganizationId(
  name: string,
  acronym: string,
  type: string | null,
) {
  return `hapi:${JSON.stringify([name, acronym, type])}`;
}
export const sectorTopics: Record<string, OrganizationTopic[]> = {
  HEA: ["Health"],
  NUT: ["Hunger"],
  FSC: ["Hunger"],
  WSH: ["Water"],
  PRO: ["Human rights"],
  EDU: ["Education"],
  SHL: ["Shelter"],
  CCC: ["Camp management"],
  ERL: ["Poverty"],
  GBV: ["Women's rights"],
  "PRO-GBV": ["Women's rights"],
  "PRO-CPN": ["Children"],
  "PRO-MIN": ["Conflict response"],
  "PRO-HLP": ["Human rights"],
  Cash: ["Poverty"],
  ERY: ["Poverty"],
  CCM: ["Camp management"],
  CP: ["Children"],
};
export function mergeDirectoryOrganizations(records: DirectoryOrganization[]) {
  const groups = new Map<string, DirectoryOrganization>();
  for (const record of records) {
    const previous = groups.get(record.id);
    if (!previous) {
      groups.set(record.id, structuredClone(record));
      continue;
    }
    previous.identifiers = [
      ...new Map(
        [...previous.identifiers, ...record.identifiers].map((id) => [
          JSON.stringify(id),
          id,
        ]),
      ).values(),
    ];
    previous.topics = [
      ...new Set([...previous.topics, ...record.topics]),
    ].sort();
    const presence = new Map<string, OrganizationPresence>();
    for (const area of [...previous.presence, ...record.presence]) {
      const key = JSON.stringify([
        area.countryCode,
        area.areaCode,
        area.region,
        area.start,
        area.evidence.url,
      ]);
      const existing = presence.get(key);
      presence.set(
        key,
        existing
          ? {
              ...area,
              sectors: [
                ...new Set([...existing.sectors, ...area.sectors]),
              ].sort(),
            }
          : area,
      );
    }
    previous.presence = [...presence.values()];
    if (record.directoryLocations?.length)
      previous.directoryLocations = [
        ...new Map(
          [
            ...(previous.directoryLocations ?? []),
            ...record.directoryLocations,
          ].map((location) => [JSON.stringify(location), location]),
        ).values(),
      ];
    previous.sources = [
      ...new Map(
        [...previous.sources, ...record.sources].map((source) => [
          source.url,
          source,
        ]),
      ).values(),
    ];
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function organizationCountryOverview(
  org: DirectoryOrganization,
): DirectoryOrganization {
  const groups = new Map<string, OrganizationPresence>();
  for (const area of org.presence) {
    const previous = groups.get(area.countryCode);
    groups.set(
      area.countryCode,
      previous
        ? {
            ...previous,
            sectors: [
              ...new Set([...previous.sectors, ...area.sectors]),
            ].sort(),
          }
        : { ...area, region: null, areaCode: null },
    );
  }
  return { ...org, presence: [...groups.values()] };
}

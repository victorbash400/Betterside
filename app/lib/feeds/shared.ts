import { z } from "zod";
export const coordinatesSchema = z.tuple([
  z.number().min(-180).max(180), z.number().min(-90).max(90),
]);
export const pointSchema = z.object({
  type: z.literal("Point"), coordinates: coordinatesSchema,
});
export const feedDate = z.string().transform((value, context) => {
  // These providers document timezone-free timestamps as UTC.
  const timestamp = value.includes("T") && !value.endsWith("Z") &&
    !value.slice(10).includes("+") && !value.slice(10).includes("-")
    ? `${value}Z` : value;
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) {
    context.addIssue({ code: "custom", message: "Invalid source timestamp." });
    return z.NEVER;
  }
  return date.toISOString();
});
export const countryFeedSchema = z.object({
  results: z.array(z.object({
    id: z.number(), iso3: z.string().nullable(), name: z.string(),
    centroid: pointSchema.nullable(), is_deprecated: z.boolean(),
    record_type: z.number(),
  })),
  next: z.string().nullable(),
});
export type Country = z.infer<typeof countryFeedSchema>["results"][number];
export function countryIndex(countries: Country[]) {
  return new Map(countries.filter((country) =>
    country.iso3 && country.centroid && !country.is_deprecated && country.record_type === 1,
  ).map((country) => [country.iso3!, country]));
}
export function sourceUrlIdentity(value: string) {
  const url = new URL(value);
  if (["gdacs.org", "www.gdacs.org"].includes(url.hostname)) {
    const type = url.searchParams.get("eventtype"), id = url.searchParams.get("eventid");
    if (type && id) return `gdacs:${type.toUpperCase()}:${id}`;
  }
  if (url.hostname === "earthquake.usgs.gov") {
    const parts = url.pathname.split("/").filter(Boolean);
    const index = parts.indexOf("eventpage");
    if (index >= 0 && parts[index + 1]) return `usgs:${parts[index + 1]}`;
  }
  url.protocol = "https:";
  url.hash = "";
  url.searchParams.delete("episodeid");
  url.searchParams.sort();
  return `url:${url.href}`;
}

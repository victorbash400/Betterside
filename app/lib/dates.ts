export function formatDate(value: unknown, timeZone?: string) {
  if (typeof value !== "string" && typeof value !== "number")
    return "Date unavailable";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone }).format(date);
}

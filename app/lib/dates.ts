export function formatDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number")
    return "Date unavailable";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

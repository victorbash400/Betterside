export function feedRequestKey(
  url: string | URL,
  headers?: Record<string, string>,
) {
  const normalized = new URL(url);
  normalized.hash = "";
  normalized.searchParams.sort();
  const normalizedHeaders = Array.from(new Headers(headers).entries()).sort(
    ([a], [b]) => a.localeCompare(b),
  );
  return JSON.stringify([normalized.toString(), normalizedHeaders]);
}

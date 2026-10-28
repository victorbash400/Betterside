import type { MapItem } from "../types.ts";
// Only provider identities establish equivalence. Names, distances and dates do not.
export function deduplicateRecords(records: MapItem[]): MapItem[] {
  const groups = new Map<string, MapItem>();
  const owners = new Map<string, string>();
  const unique = new Map(records.map((item) => [item.id, item]));
  for (const item of unique.values()) {
    const keys = [`id:${item.id}`, ...(item.project ? [] : item.identities ?? [])];
    const matches = new Set(keys.flatMap((key) => owners.get(key) ?? []));
    const primaryId = matches.values().next().value ?? item.id;
    let primary = groups.get(primaryId) ?? item;
    for (const id of matches) {
      if (id === primaryId) continue;
      const other = groups.get(id)!;
      primary = combine(primary, other);
      groups.delete(id);
      for (const [key, owner] of owners) if (owner === id) owners.set(key, primaryId);
    }
    if (primary !== item) primary = combine(primary, item);
    groups.set(primaryId, primary);
    for (const key of keys) owners.set(key, primaryId);
  }
  return [...groups.values()];
}
function combine(primary: MapItem, item: MapItem): MapItem {
  if (primary.id === item.id) return item;
  const sources = [primary.source, ...(primary.relatedSources ?? []), item.source, ...(item.relatedSources ?? [])];
  return {
    ...primary,
    aliases: [...new Set([...(primary.aliases ?? []), item.id, ...(item.aliases ?? [])])],
    identities: [...new Set([...(primary.identities ?? []), ...(item.identities ?? [])])],
    relatedSources: [...new Map(sources.map((source) => [source.url, source])).values()]
      .filter((source) => source.url !== primary.source.url),
  };
}

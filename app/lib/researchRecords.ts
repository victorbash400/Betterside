import { concerns, matchesConcern } from "./concerns.ts";
import type { MapItem, IssueKind } from "./types.ts";
import type { DatasetId } from "./dataSources.ts";
export function searchRecords(
  records: MapItem[],
  input: {
    query?: string;
    country?: string;
    kind?: IssueKind;
    dataset?: DatasetId;
    offset?: number;
    sort?: "recent" | "name" | "country" | "funding-gap";
  },
) {
  const words = (input.query ?? "")
    .toLocaleLowerCase()
    .split(" ")
    .filter(Boolean);
  const country = input.country?.trim().toLocaleLowerCase();
  const matches = records
    .filter((item) => {
      if (input.kind && item.kind !== input.kind) return false;
      if (input.dataset && (item.dataset ?? "catalogue") !== input.dataset)
        return false;
      if (country && !item.country.toLocaleLowerCase().includes(country))
        return false;
      const text = [
        item.location,
        item.country,
        item.kind,
        item.summary,
        item.source.label,
        ...concerns
          .filter((concern) => matchesConcern(item, concern.id))
          .map((concern) => concern.label),
      ]
        .join(" ")
        .toLocaleLowerCase();
      return words.every((word) => text.includes(word));
    })
    .toSorted((a, b) => {
      if (input.sort === "name")
        return (a.project?.name ?? a.location).localeCompare(
          b.project?.name ?? b.location,
        );
      if (input.sort === "country")
        return a.country.localeCompare(b.country) || a.id.localeCompare(b.id);
      if (input.sort === "funding-gap") {
        const gap = (record: MapItem) =>
          record.project
            ? Math.max(0, record.project.target - record.project.raised)
            : -1;
        return gap(b) - gap(a) || a.id.localeCompare(b.id);
      }
      return (
        b.referencePeriod?.start ??
        b.source.published ??
        ""
      ).localeCompare(a.referencePeriod?.start ?? a.source.published ?? "");
    });
  const offset = input.offset ?? 0;
  return {
    total: matches.length,
    records: matches.slice(offset, offset + 20),
    nextOffset: offset + 20 < matches.length ? offset + 20 : null,
  };
}
export function researchOverview(records: MapItem[]) {
  const counts = new Map<string, number>();
  for (const item of records) {
    const key = `${item.dataset ?? "catalogue"}: ${item.kind}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return {
    recordCount: records.length,
    counts: Object.fromEntries(counts),
    countries: [
      ...new Set(records.map((item) => item.country).filter(Boolean)),
    ].sort(),
  };
}

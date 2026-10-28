import "server-only";
import { gdacsEvents, gdacsSchema } from "../../lib/feeds/gdacs";
import { ifrcEvents, ifrcSchema } from "../../lib/feeds/ifrc";
import type { Country } from "../../lib/feeds/shared";
import type { MapItem } from "../../lib/types";
import { sourceTtl } from "../../lib/feedCachePolicy";
import { feedJson } from "./request";
export async function loadGdacs(reviewed: string) {
  const start = new Date(reviewed);
  start.setUTCDate(start.getUTCDate() - 60);
  const issues: MapItem[] = [];
  for (let page = 1; page <= 10; page++) {
    const url = new URL(
      "https://www.gdacs.org/gdacsapi/api/Events/geteventlist/search",
    );
    url.search = new URLSearchParams({
      eventlist: "EQ;TC;FL;VO;DR;WF",
      fromDate: start.toISOString().slice(0, 10),
      toDate: reviewed.slice(0, 10),
      pageSize: "100",
      pageNumber: String(page),
    }).toString();
    try {
      const raw = await feedJson(url, undefined, sourceTtl.gdacs, (raw) =>
        raw === null ? null : gdacsSchema.parse(raw),
      );
      if (raw === null) return { issues, skipped: 0, truncated: false };
      const feed = gdacsSchema.parse(raw);
      if (!feed.features.length)
        return { issues, skipped: 0, truncated: false };
      issues.push(...gdacsEvents(feed, reviewed));
    } catch (error) {
      if (!issues.length) throw error;
      return { issues, skipped: 0, truncated: true };
    }
  }
  return { issues, skipped: 0, truncated: true };
}
export async function loadIfrc(countries: Country[], reviewed: string) {
  const start = new Date(reviewed);
  start.setUTCDate(start.getUTCDate() - 180);
  const results: unknown[] = [];
  for (let page = 0; page < 10; page++) {
    const url = new URL("https://goadmin.ifrc.org/api/v2/event/");
    url.search = new URLSearchParams({
      limit: "100",
      offset: String(page * 100),
      ordering: "-updated_at",
      updated_at__gte: start.toISOString().slice(0, 10),
    }).toString();
    const feed = ifrcSchema.parse(
      await feedJson(url, undefined, sourceTtl.ifrc, (raw) =>
        ifrcSchema.parse(raw),
      ),
    );
    results.push(...feed.results);
    if (!feed.next)
      return {
        ...ifrcEvents({ results, next: null }, countries, reviewed),
        truncated: false,
      };
  }
  return {
    ...ifrcEvents({ results, next: null }, countries, reviewed),
    truncated: true,
  };
}

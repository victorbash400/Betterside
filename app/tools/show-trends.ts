import "server-only";
import { tool } from "ai";
import { chatTrendsInputSchema, chatTrendsResultSchema } from "../lib/chatTrends.ts";
import { pinTrendScope } from "../lib/pins.ts";
import { loadTracking } from "../server/tracking.ts";
import { loadTrends } from "../server/trends.ts";
import type { TrendScope } from "../lib/trends.ts";
import type { WorkspaceToolContext } from "./context.ts";
export function showTrendsTool(context: WorkspaceToolContext) {
  return tool({
    description: "Show dated provider measurements inline. Call directly with ISO3 country codes and concern IDs, or saved pin IDs. For a named series, pass its title as seriesLabel in the country scope, for example Armed Clashes in Sudan (Overview) with SDN and displacement. Record IDs are optional. Use the exact dated observations in the result and never infer causes or sum overlapping populations. Supports up to four countries. Offset paginates series, not observations.",
    inputSchema: chatTrendsInputSchema,
    outputSchema: chatTrendsResultSchema,
    execute: async (input) => {
      let scopes: TrendScope[] = input.scopes ?? [];
      if (input.pinIds) {
        const snapshot = (await loadTracking(context.donor)).snapshot;
        scopes = input.pinIds.map((id) => {
          const pin = snapshot?.interests.find((pin) => pin.id === id && !pin.archived)
            ?? (snapshot?.following.includes(id) ? { id, name: id, issueIds: [id], hiddenKinds: [] } : undefined);
          if (!pin) throw new Error("Pin unavailable. Read list_pins again.");
          const scope = pinTrendScope(pin, context.records);
          if (!scope) throw new Error("Choose a country for this pin to view trends.");
          return scope;
        });
      }
      if (new Set(scopes.flatMap((scope) => scope.countries)).size > 4)
        throw new Error("Compare up to four countries.");
      const results = await Promise.all(scopes.map((scope) => loadTrends(scope)));
      const series = [...new Map(results.flatMap((result) => result.value.series).map((series) => [series.id, series])).values()];
      const page = series.slice(input.offset, input.offset + 12);
      return chatTrendsResultSchema.parse({
        kind: "trends", scopes, view: input.view,
        series: page,
        summaries: page.flatMap(({ id, label, points }) => {
          const latest = points.at(-1);
          if (!latest) return [];
          return [{
            seriesId: id,
            label,
            latest,
            previous: points.at(-2),
            highest: points.reduce((highest, point) => point.value > highest.value ? point : highest),
          }];
        }),
        total: series.length,
        nextOffset: input.offset + 12 < series.length ? input.offset + 12 : null,
        failures: results.flatMap((result) => result.value.failures),
        fetchedAt: results[0]?.value.fetchedAt ?? new Date().toISOString(),
      });
    },
  });
}

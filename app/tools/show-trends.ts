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
    description: "Show actual dated provider measurements inline as trends or a comparison grid with sparklines, grouping, pivot, range charts and Excel export. Use scopes with exact ISO3 country codes and concern IDs, or saved pin IDs from list_pins. Supports up to four countries total. Values retain source, metric, geography and population; never sum overlapping populations. Missing history is explicit, not estimated. Cached provider history is reused. Offset paginates series, not observations.",
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
      return chatTrendsResultSchema.parse({
        kind: "trends", scopes, view: input.view,
        series: series.slice(input.offset, input.offset + 12),
        total: series.length,
        nextOffset: input.offset + 12 < series.length ? input.offset + 12 : null,
        failures: results.flatMap((result) => result.value.failures),
        fetchedAt: results[0]?.value.fetchedAt ?? new Date().toISOString(),
      });
    },
  });
}

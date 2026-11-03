import "server-only";
import { tool } from "ai";
import { chartInputSchema, chartResultSchema, buildChatChart } from "../lib/chatCharts.ts";
import type { WorkspaceToolContext } from "./context.ts";
export function showChartTool(context: WorkspaceToolContext) {
  return tool({
    description:
      "Render an inline interactive chart or summary widget using actual catalogue data, never model-supplied figures. Supports bar, column, pie, donut, histogram, radar, radial-bar, treemap, waterfall and country/cause heatmap record counts by country or issue category; line/area record counts by reference start month (not incident frequency); bar/summary demonstration funding by project. Scatter/bubble compare actual demonstration project values to targets (bubble size is the funding gap), using metric raised/target/funding-gap and groupBy project. Counts are source records, not people or distinct crises. Funding figures are illustrative sandbox amounts. Maximum 24 groups: filter country or use IDs returned by search. Undated records are counted separately, never assigned publication dates.",
    inputSchema: chartInputSchema,
    outputSchema: chartResultSchema,
    execute: async (input) => buildChatChart(context.records, input),
  });
}

import "server-only";
import { tool } from "ai";
import { z } from "zod";
import type { WorkspaceToolContext } from "./context.ts";
export function showAnalysisTool({ records }: WorkspaceToolContext) {
  return tool({
    description:
      "Open the separate analysis studio only when explicitly requested. Use show_chart for inline category charts, show_trends for dated provider measurements and pin comparisons, search_records for inline analysis grids, and show_contribution_chart for actual contribution history. All funding figures here are illustrative sandbox data.",
    inputSchema: z.object({
      kind: z.enum([
        "funding-by-area",
        "funding-by-issue",
        "project-comparison",
      ]),
    }),
    execute: async ({ kind }, { toolCallId }) => {
      if (!records.some((issue) => issue.project))
        throw new Error("No funding projects in this selection.");
      return { id: toolCallId, kind };
    },
  });
}

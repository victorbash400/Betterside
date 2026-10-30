import "server-only";
import { tool } from "ai";
import { z } from "zod";
import type { WorkspaceToolContext } from "./context.ts";
export function showAnalysisTool({ records }: WorkspaceToolContext) {
  return tool({
    description:
      "Open a funding chart only when explicitly asked for a chart or graph. Do not use for tables, grids, lists or project comparisons; use search_records for those. All figures are sandbox data.",
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

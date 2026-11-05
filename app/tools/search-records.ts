import "server-only";
import { tool } from "ai";
import { searchRecords } from "../lib/researchRecords.ts";
import { searchInputSchema } from "../lib/chatWorkspace.ts";
import type { WorkspaceToolContext } from "./context.ts";
export function searchRecordsTool({
  records,
  selectedIds,
}: WorkspaceToolContext) {
  return tool({
    description:
      "Search sourced crisis records and sandbox projects. Use presentation table when the user requests a grid or table; use lookup for evidence gathering or resolving project IDs before checkout. Use scope all to discover data even when the map has no causes selected. Literal query terms only; structured country/kind/dataset filters are preferred. Page size 20, use nextOffset. projectsOnly finds sandbox funding projects; omit dataset and words like demonstration unless they occur in the project name. Use sort funding-gap for sandbox funding gaps.",
    inputSchema: searchInputSchema,
    execute: async ({ scope, projectsOnly, presentation = "table", ...query }) => {
      const ids = new Set(selectedIds ?? []);
      const candidates = records.filter(
        (record) =>
          (scope === "all" || ids.has(record.id)) &&
          (!projectsOnly || record.project),
      );
      return {
        kind: "records" as const,
        ...(presentation === "lookup" ? { presentation } : {}),
        ...searchRecords(candidates, query),
      };
    },
  });
}

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
      "Search real sourced crisis records and demonstration projects; display results as an inline sortable grid. Use scope all to discover data even when the map has no causes selected. Literal query terms only; structured country/kind/dataset filters are preferred. Page size 20, use nextOffset. projectsOnly finds sandbox funding projects; do not add query terms like demonstration or project unless they occur in the project name. Omit dataset when finding projects. Use sort funding-gap with projectsOnly true for the largest sandbox funding gaps; name and country sorting are also available.",
    inputSchema: searchInputSchema,
    execute: async ({ scope, projectsOnly, ...query }) => {
      const ids = new Set(selectedIds ?? []);
      const candidates = records.filter(
        (record) =>
          (scope === "all" || ids.has(record.id)) &&
          (!projectsOnly || record.project),
      );
      return {
        kind: "records" as const,
        ...searchRecords(candidates, query),
      };
    },
  });
}

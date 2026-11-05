import type { UIMessage } from "ai";

const goalTools = new Set([
  "tool-list_goals",
  "tool-create_goal",
  "tool-update_goal",
  "tool-manage_goal",
]);
const tableTools = new Set(["tool-search_records", "tool-search_organizations"]);

export function visibleChatParts(parts: UIMessage["parts"]) {
  const latestGoal = parts.findLastIndex((part) =>
    goalTools.has(part.type) && "state" in part && part.state === "output-available",
  );
  const tables = new Set<string>();
  return parts.flatMap((part, index) => {
    if ("state" in part && part.state === "output-available") {
      if (index < latestGoal && goalTools.has(part.type)) return [];
      if ("output" in part && tableTools.has(part.type)) {
        const output = part.output;
        if (part.type === "tool-search_records" && output && typeof output === "object" &&
            "presentation" in output && output.presentation === "lookup") return [];
        const key = JSON.stringify([part.type, output]);
        if (tables.has(key)) return [];
        tables.add(key);
      }
    }
    return [{ part, index }];
  });
}

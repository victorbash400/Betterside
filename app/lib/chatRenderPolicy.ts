import type { UIMessage } from "ai";

const goalTools = new Set([
  "tool-list_goals",
  "tool-create_goal",
  "tool-update_goal",
  "tool-manage_goal",
]);
const tableTools = new Set(["tool-search_records", "tool-search_organizations"]);

export function toolCallStatus(part: UIMessage["parts"][number], busy: boolean) {
  if (!("toolCallId" in part) || !("state" in part)) return undefined;
  switch (part.state) {
    case "output-error": return "error";
    case "output-available": return "done";
    case "output-denied": return "cancelled";
    case "approval-requested": return "approval";
    case "approval-responded":
      if (part.approval.approved === false) return "cancelled";
  }
  return busy ? "running" : "stopped";
}

export function showThinkingIndicator(messages: UIMessage[], busy: boolean) {
  if (!busy) return false;
  const latest = messages.at(-1);
  return latest?.role !== "assistant" || !latest.parts.some((part) =>
    part.type === "text" ? Boolean(part.text.trim()) : "toolCallId" in part,
  );
}

export function visibleChatParts(parts: UIMessage["parts"]) {
  const latestGoal = parts.findLastIndex((part) =>
    goalTools.has(part.type) && "state" in part && part.state === "output-available",
  );
  const tables = new Set<string>();
  return parts.map((part, index) => {
    let showResult = true;
    if ("state" in part && part.state === "output-available") {
      if (index < latestGoal && goalTools.has(part.type)) showResult = false;
      if ("output" in part && tableTools.has(part.type)) {
        const output = part.output;
        if (part.type === "tool-search_records" && output && typeof output === "object" &&
            "presentation" in output && output.presentation === "lookup") showResult = false;
        const key = JSON.stringify([part.type, output]);
        if (tables.has(key)) showResult = false;
        tables.add(key);
      }
    }
    return { part, index, showResult };
  });
}

import type { UIMessage } from "ai";
const inlineResults = new Set([
  "tool-list_pins", "tool-pin_items", "tool-unpin_items", "tool-show_trends", "tool-show_chart", "tool-show_summary",
  "tool-list_goals", "tool-create_goal", "tool-update_goal", "tool-manage_goal", "tool-list_contributions",
  "tool-get_contribution", "tool-show_contribution_chart", "tool-get_paypal_status", "tool-search_records", "tool-search_organizations",
]);
export function hasInlineResult(parts: UIMessage["parts"]): boolean {
  return parts.some((part) => inlineResults.has(part.type) && "state" in part && typeof part.state === "string" && ["output-available", "approval-requested", "approval-responded", "output-denied"].includes(part.state));
}

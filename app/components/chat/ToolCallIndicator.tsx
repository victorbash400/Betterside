import { SquareTerminal } from "lucide-react";
import type { UIMessage } from "ai";
import styles from "./ToolCallIndicator.module.css";

const names: Record<string, string> = {
  "tool-get_paypal_status": "Reading PayPal status",
  "tool-list_pins": "Reading pins",
  "tool-pin_items": "Saving pins",
  "tool-unpin_items": "Removing pins",
  "tool-manage_goal": "Updating subscription",
  "tool-get_contribution": "Reading receipt",
  "tool-list_goals": "Reading goals",
  "tool-create_goal": "Saving goal",
  "tool-update_goal": "Updating goal",
  "tool-search_records": "Searching records",
  "tool-search_organizations": "Searching organizations",
  "tool-filter_map": "Updating map",
  "tool-save_records": "Saving records",
  "tool-focus_organization": "Selecting organization",
  "tool-calculate": "Calculating",
  "tool-show_contribution_chart": "Reading contribution history",
  "tool-show_contribution_report": "Preparing contribution report",
  "tool-show_trends": "Reading trend history",
  "tool-show_summary": "Preparing summary",
  "tool-show_chart": "Preparing chart",
  "tool-open_checkout": "Opening checkout",
  "tool-prepare_payment": "Creating sandbox order",
  "tool-list_contributions": "Reading contribution records",
  "tool-show_analysis": "Preparing analysis",
};

export default function ToolCallIndicator({ part, busy }: {
  part: UIMessage["parts"][number];
  busy: boolean;
}) {
  if (!("toolCallId" in part) || !("state" in part)) return null;
  const status = part.state === "output-error" ? "error"
    : part.state === "output-available" ? "done"
    : part.state === "output-denied" ? "cancelled"
    : part.state === "approval-requested" ? "approval"
    : busy ? "running" : "stopped";
  const name = part.type === "dynamic-tool" ? part.toolName.replaceAll("_", " ")
    : names[part.type] ?? part.type.slice(5).replaceAll("_", " ");
  return (
    <span className={styles.tool} data-status={status} role={status === "running" ? "status" : undefined}>
      <SquareTerminal aria-hidden="true" size={14} />
      <strong>{name}</strong>
    </span>
  );
}

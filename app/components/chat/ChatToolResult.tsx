import ChatGoalsWidget from "./ChatGoalsWidget";
import { goalsResultSchema } from "../../lib/chatGoals";
import dynamic from "next/dynamic";
import { chartResultSchema } from "../../lib/chatCharts";
import { useState } from "react";
import type { UIMessage } from "ai";
import {
  checkoutResultSchema,
  recordsResultSchema,
  contributionsResultSchema,
  organizationsResultSchema,
  paymentResultSchema,
  calculationResultSchema,
  mapResultSchema,
  savedResultSchema,
  type ChatWorkspaceActions,
} from "../../lib/chatWorkspace";
import type { MapItem } from "../../lib/types";
import ChatContributionGrid from "./ChatContributionGrid";
import ChatRecordGrid from "./ChatRecordGrid";
import ChatOrganizationGrid from "./ChatOrganizationGrid";
import ChatCheckoutCard from "./ChatCheckoutCard";
import ChatPaymentCard from "./ChatPaymentCard";
import ChatCalculationCard from "./ChatCalculationCard";
import styles from "./ChatResult.module.css";
const ChatChartWidget = dynamic(() => import("./ChatChartWidget"), {
  ssr: false,
});
export default function ChatToolResult({
  part,
  onSelect,
  onMessage,
  actions,
  busy,
}: {
  part: UIMessage["parts"][number];
  onSelect: (record: MapItem) => void;
  onMessage: (text: string) => void;
  actions: ChatWorkspaceActions;
  busy: boolean;
}) {
  const [actionError, setActionError] = useState("");
  if (actionError)
    return (
      <p role="alert" className={styles.error}>
        {actionError}
      </p>
    );
  if (!("toolCallId" in part) || !("state" in part)) return null;
  if (part.state === "output-error")
    return (
      <p role="alert" className={styles.error}>
        {part.errorText}
      </p>
    );
  if (part.state !== "output-available") {
    const names: Record<string, string> = {
      "tool-list_goals": "Reading goals",
      "tool-create_goal": "Saving goal",
      "tool-update_goal": "Updating goal",
      "tool-search_records": "Searching records",
      "tool-search_organizations": "Searching organizations",
      "tool-filter_map": "Updating map",
      "tool-save_records": "Saving records",
      "tool-focus_organization": "Selecting organization",
      "tool-calculate": "Calculating",
      "tool-show_summary": "Preparing summary",
      "tool-show_chart": "Preparing chart",
      "tool-open_checkout": "Opening checkout",
      "tool-prepare_payment": "Creating sandbox order",
      "tool-list_contributions": "Reading contribution records",
      "tool-show_analysis": "Preparing analysis",
    };
    return (
      <span role="status" className={styles.muted}>
        {names[part.type] ?? "Working"}
      </span>
    );
  }
  const output = part.output;
  switch (part.type) {
    case "tool-list_goals":
    case "tool-create_goal":
    case "tool-update_goal": {
      const parsed = goalsResultSchema.safeParse(output);
      return parsed.success ? (
        <ChatGoalsWidget result={parsed.data} actions={actions} busy={busy} />
      ) : (
        <span role="alert">Goals unavailable.</span>
      );
    }
    case "tool-show_summary":
    case "tool-show_chart": {
      const parsed = chartResultSchema.safeParse(output);
      return parsed.success ? (
        <ChatChartWidget chart={parsed.data} />
      ) : (
        <span role="alert">Chart unavailable.</span>
      );
    }
    case "tool-open_checkout": {
      const parsed = checkoutResultSchema.safeParse(output);
      return parsed.success ? (
        <ChatCheckoutCard input={parsed.data} actions={actions} />
      ) : (
        <span role="alert">Checkout unavailable.</span>
      );
    }
    case "tool-search_records": {
      const parsed = recordsResultSchema.safeParse(output);
      return parsed.success ? (
        <ChatRecordGrid
          {...parsed.data}
          onSelect={onSelect}
          busy={busy}
          onMore={() =>
            onMessage(
              `Show the next page from that record search using the same filters and offset ${parsed.data.nextOffset}.`,
            )
          }
        />
      ) : (
        <span role="alert">Record results unavailable.</span>
      );
    }
    case "tool-search_organizations": {
      const parsed = organizationsResultSchema.safeParse(output);
      return parsed.success ? (
        <ChatOrganizationGrid
          {...parsed.data}
          busy={busy}
          onSelect={(organizationId) => {
            setActionError("");
            void actions
              .focusOrganization({ organizationId, topics: [] })
              .catch((error) =>
                setActionError(
                  error instanceof Error
                    ? error.message
                    : "Could not select organization.",
                ),
              );
          }}
          onMore={() =>
            onMessage(
              `Show the next page from that organization search using the same filters and offset ${parsed.data.nextOffset}.`,
            )
          }
        />
      ) : (
        <span role="alert">Organization results unavailable.</span>
      );
    }
    case "tool-list_contributions": {
      const parsed = contributionsResultSchema.safeParse(output);
      return parsed.success ? (
        <ChatContributionGrid
          {...parsed.data}
          busy={busy}
          onMore={() =>
            onMessage(
              `Show the next page of my sandbox orders with the same status filter and offset ${parsed.data.nextOffset}.`,
            )
          }
        />
      ) : (
        <span role="alert">Contribution records unavailable.</span>
      );
    }
    case "tool-prepare_payment": {
      const parsed = paymentResultSchema.safeParse(output);
      return parsed.success ? (
        <ChatPaymentCard order={parsed.data} />
      ) : (
        <span role="alert">Payment order unavailable.</span>
      );
    }
    case "tool-calculate": {
      const parsed = calculationResultSchema.safeParse(output);
      return parsed.success ? (
        <ChatCalculationCard calculation={parsed.data} />
      ) : (
        <span role="alert">Calculation unavailable.</span>
      );
    }
    case "tool-filter_map": {
      const parsed = mapResultSchema.safeParse(output);
      return parsed.success ? (
        <div className={styles.result}>
          <span>
            {parsed.data.country || "All countries"} · {parsed.data.mode}
          </span>
          <span>{parsed.data.count.toLocaleString("en")} records</span>
        </div>
      ) : (
        <span role="alert">Map action unavailable.</span>
      );
    }
    case "tool-save_records": {
      const parsed = savedResultSchema.safeParse(output);
      return parsed.success ? (
        <div className={styles.result}>
          <strong>{parsed.data.name}</strong>
          <span>{parsed.data.count} saved records</span>
        </div>
      ) : (
        <span role="alert">Save result unavailable.</span>
      );
    }
    case "tool-focus_organization":
      return <span className={styles.muted}>Organization selected</span>;
    default:
      return null;
  }
}

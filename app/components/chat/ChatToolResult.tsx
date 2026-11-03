import type { ChatMessageAction } from "../../lib/chatActions";
import ChatPayPalStatus from "./ChatPayPalStatus";
import { paypalStatusResultSchema } from "../../lib/chatPayPal";
import ChatToolApproval from "./ChatToolApproval";
import { chatTrendsResultSchema } from "../../lib/chatTrends";
import ChatTrendsWidget from "./ChatTrendsWidget";
import ChatPinsWidget from "./ChatPinsWidget";
import { pinsResultSchema } from "../../lib/chatPins";
import ChatLoadingIndicator from "./ChatLoadingIndicator";
import LoadingRegion from "../controls/LoadingRegion";
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
  loading: () => <LoadingRegion compact label="Loading chart" />,
});
export default function ChatToolResult({
  part,
  onSelect,
  onMessage,
  actions,
  busy,
  onApprove,
  goalNames,
}: {
  part: UIMessage["parts"][number];
  onSelect: (record: MapItem) => void;
  onMessage: ChatMessageAction;
  actions: ChatWorkspaceActions;
  busy: boolean;
  onApprove: (id: string, approved: boolean) => void;
  goalNames: Map<string, string>;
}) {
  const [actionError, setActionError] = useState("");
  if (actionError)
    return (
      <p role="alert" className={styles.error}>
        {actionError}
      </p>
    );
  if (!("toolCallId" in part) || !("state" in part)) return null;
  if (part.state === "approval-requested" && "approval" in part && part.approval) {
    const input = part.input as { action?: string; goalId?: string };
    const name = goalNames.get(input.goalId ?? "");
    return name ? <ChatToolApproval id={part.approval.id} action={input.action ?? ""}
      name={name} onApprove={onApprove}/> : <span role="alert">Read goals before confirming.</span>;
  }
  if (part.state === "approval-responded" && "approval" in part && part.approval?.approved === false)
    return <span className={styles.muted}>Action cancelled</span>;
  if (part.state === "output-denied") return <span className={styles.muted}>Action cancelled</span>;
  if (part.state === "output-error")
    return (
      <p role="alert" className={styles.error}>
        {part.errorText}
      </p>
    );
  if (part.state !== "output-available") {
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
      "tool-show_trends": "Reading trend history",
      "tool-show_summary": "Preparing summary",
      "tool-show_chart": "Preparing chart",
      "tool-open_checkout": "Opening checkout",
      "tool-prepare_payment": "Creating sandbox order",
      "tool-list_contributions": "Reading contribution records",
      "tool-show_analysis": "Preparing analysis",
    };
    return <ChatLoadingIndicator label={names[part.type] ?? "Working"} />;
  }
  const output = part.output;
  switch (part.type) {
    case "tool-get_paypal_status": {
      const parsed = paypalStatusResultSchema.safeParse(output);
      return parsed.success ? <ChatPayPalStatus status={parsed.data} actions={actions}/> : <span role="alert">PayPal status unavailable.</span>;
    }
    case "tool-list_pins":
    case "tool-pin_items":
    case "tool-unpin_items": {
      const parsed = pinsResultSchema.safeParse(output);
      return parsed.success ? <ChatPinsWidget result={parsed.data} actions={actions} onMessage={onMessage}/> : <span role="alert">Pins unavailable.</span>;
    }
    case "tool-list_goals":
    case "tool-create_goal":
    case "tool-update_goal":
    case "tool-manage_goal": {
      const parsed = goalsResultSchema.safeParse(output);
      return parsed.success ? (
        <ChatGoalsWidget result={parsed.data} actions={actions} onMessage={onMessage} busy={busy} />
      ) : (
        <span role="alert">Goals unavailable.</span>
      );
    }
    case "tool-show_trends": {
      const parsed = chatTrendsResultSchema.safeParse(output);
      return parsed.success ? <ChatTrendsWidget result={parsed.data} onMessage={onMessage} busy={busy}/> : <span role="alert">Trends unavailable.</span>;
    }
    case "tool-show_summary":
    case "tool-show_chart":
    case "tool-show_contribution_chart": {
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
    case "tool-list_contributions":
    case "tool-get_contribution": {
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

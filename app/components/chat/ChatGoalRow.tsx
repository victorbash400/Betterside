import type { ChatMessageAction } from "../../lib/chatActions";
import { useState } from "react";
import type { GoalsResult } from "../../lib/chatGoals";
import { Trash2 } from "lucide-react";
import IconButton from "../controls/IconButton";
import { canDeleteGoal, pendingApprovalPath, type GoalSubscription } from "../../lib/paypalSubscription";
import type { ChatWorkspaceActions } from "../../lib/chatWorkspace";
import SettingsRow from "../settings/SettingsRow";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import styles from "./ChatGoalRow.module.css";
export default function ChatGoalRow({ goal, subscription, revision, actions, onMessage, busy, timeZone, canContribute }: {
  goal: GoalsResult["goals"][number];
  subscription?: GoalSubscription;
  revision: number;
  timeZone: string;
  actions: ChatWorkspaceActions;
  onMessage: ChatMessageAction;
  busy: boolean;
  canContribute: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const format = (cents: number) => new Intl.NumberFormat("en", { style: "currency", currency: "USD" }).format(cents / 100);
  function manage(action: "pause" | "resume" | "cancel" | "refresh" | "remove") {
    const labels = { pause: "Pause", resume: "Resume", cancel: "Cancel subscription for", refresh: "Refresh status for", remove: "Delete" };
    onMessage(`${labels[action]} ${goal.targetText || goal.category}.`, { kind: "manage-goal", goalId: goal.id, revision, action });
  }
  const approval = subscription?.status === "APPROVAL_PENDING" && subscription.approvalUrl
    ? pendingApprovalPath(goal.id)
    : subscription?.pendingChange?.approvalUrl;
  return <div>
    <SettingsRow label={goal.targetText || goal.category}>
      <span>{format(goal.targetCents)}{goal.period === "monthly" ? " / month" : ""}</span>
      <SettingsInlineButton aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>Details</SettingsInlineButton>
    </SettingsRow>
    {approval && (
      <div className={styles.approval}>
        <a href={approval} target="_blank" rel="noopener noreferrer">Continue in PayPal</a>
      </div>
    )}
    {expanded && <div className={styles.details}>
      <SettingsRow label="Contributed"><span>{format(goal.contributedCents)}</span></SettingsRow>
      <SettingsRow label="Status"><span>{subscription?.status ?? goal.status ?? "active"}</span></SettingsRow>
      {subscription?.nextBillingTime && <SettingsRow label="Next payment"><span>{new Date(subscription.nextBillingTime).toLocaleDateString("en", { timeZone })}</span></SettingsRow>}
      {subscription?.pendingChange && <SettingsRow label="Pending amount"><span>{subscription.pendingChange.amount} USD</span></SettingsRow>}
      <div className={styles.actions}>
        {subscription?.status === "ACTIVE" && <SettingsInlineButton disabled={busy} onClick={() => manage("pause")}>Pause</SettingsInlineButton>}
        {subscription?.status === "SUSPENDED" && <SettingsInlineButton disabled={busy} onClick={() => manage("resume")}>Resume</SettingsInlineButton>}
        {subscription && <SettingsInlineButton disabled={busy} onClick={() => manage("refresh")}>Refresh status</SettingsInlineButton>}
        {subscription && ["ACTIVE", "SUSPENDED", "APPROVED"].includes(subscription.status) && <SettingsInlineButton disabled={busy} onClick={() => manage("cancel")}>Cancel subscription</SettingsInlineButton>}
        {canDeleteGoal(subscription) && (
          <IconButton label="Delete goal" title="Delete goal" disabled={busy} onClick={() => manage("remove")}>
            <Trash2 />
          </IconButton>
        )}
        <SettingsInlineButton disabled={busy || !canContribute} onClick={() => {
          setError("");
          void actions.openCheckout({ goalId: goal.id }).catch((failure) => setError(failure instanceof Error ? failure.message : "Checkout unavailable."));
        }}>Contribute</SettingsInlineButton>
      </div>
      {error && <span role="alert">{error}</span>}
    </div>}
  </div>;
}

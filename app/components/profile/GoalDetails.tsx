import { useState } from "react";
import { Pencil } from "lucide-react";
import SettingsGroup from "../settings/SettingsGroup";
import SettingsRow from "../settings/SettingsRow";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import ToggleSwitch from "../controls/ToggleSwitch";
import IconButton from "../controls/IconButton";
import GoalDetailActions from "./GoalDetailActions";
import GoalNavigation from "./GoalNavigation";
import SubscriptionAmountEditor from "./SubscriptionAmountEditor";
import { type GoalSubscription } from "../../lib/paypalSubscription";
import { useGoalSubscriptionActions } from "../../state/useGoalSubscriptionActions";
import type { ContributionGoal } from "../../lib/profile";
import { formatDate } from "../../lib/dates";
import styles from "./GoalDetails.module.css";
const labels: Record<GoalSubscription["status"], string> = {
  APPROVAL_PENDING: "Awaiting approval",
  APPROVED: "Approved",
  ACTIVE: "Active",
  SUSPENDED: "Paused",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};
export default function GoalDetails({
  goal,
  subscription: saved,
  contributedCents,
  onBack,
  onSetup,
  onDelete,
  saving,
}: {
  goal: ContributionGoal;
  subscription?: GoalSubscription;
  contributedCents: number;
  onBack: () => void;
  onSetup: () => void;
  onDelete: () => Promise<void>;
  saving: boolean;
}) {
  const [latest, setLatest] = useState<GoalSubscription>();
  const subscription = latest ?? saved;
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const actions = useGoalSubscriptionActions(goal.id);
  const busy = actions.busy || saving;
  const active =
    subscription && ["ACTIVE", "SUSPENDED"].includes(subscription.status);
  async function run(
    action: "pause" | "resume" | "cancel" | "adjust" | "refresh",
    amount?: string,
  ) {
    const record = await actions.run(action, amount);
    if (record) {
      setLatest(record);
      setEditing(false);
    }
  }
  async function deleteGoal() {
    setError("");
    try {
      await onDelete();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not remove goal.",
      );
    }
  }
  if (editing && subscription)
    return (
      <div className={styles.detail}>
        <GoalNavigation
          title="Adjust amount"
          onBack={() => setEditing(false)}
          busy={busy}
        />
        <SubscriptionAmountEditor
          amount={subscription.amount}
          busy={busy}
          onCancel={() => setEditing(false)}
          onSave={(amount) => run("adjust", amount)}
        />
        {actions.error && (
          <span className={styles.error} role="alert">
            {actions.error}
          </span>
        )}
      </div>
    );
  return (
    <div className={styles.detail}>
      <GoalNavigation
        title={goal.targetText || goal.category}
        onBack={onBack}
        busy={busy}
        onRefresh={subscription ? () => void run("refresh") : undefined}
      />
      <SettingsGroup>
        <SettingsRow label="Cause">
          <span>{goal.category}</span>
        </SettingsRow>
        {goal.organization && (
          <SettingsRow label="Organization">
            <span>{goal.organization.name}</span>
          </SettingsRow>
        )}
        {subscription && (
          <SettingsRow label="Subscription">
            {active ? (
              <ToggleSwitch
                label={
                  subscription.status === "ACTIVE"
                    ? "Pause subscription"
                    : "Resume subscription"
                }
                checked={subscription.status === "ACTIVE"}
                disabled={busy}
                onChange={(enabled) => void run(enabled ? "resume" : "pause")}
              />
            ) : (
              <span>{labels[subscription.status]}</span>
            )}
          </SettingsRow>
        )}
        <SettingsRow label={subscription ? "Monthly amount" : "Target"}>
          <span>
            {new Intl.NumberFormat("en", {
              style: "currency",
              currency: "USD",
            }).format(
              subscription
                ? Number(subscription.amount)
                : goal.targetCents / 100,
            )}
          </span>
          {active && !subscription.pendingChange && (
            <IconButton
              label="Adjust monthly amount"
              title="Adjust monthly amount"
              disabled={busy}
              onClick={() => setEditing(true)}
            >
              <Pencil />
            </IconButton>
          )}
        </SettingsRow>
        {subscription && (
          <SettingsRow label="Payment">
            <span>PayPal</span>
          </SettingsRow>
        )}
        {subscription?.nextBillingTime && (
          <SettingsRow label="Next payment">
            <span>{formatDate(subscription.nextBillingTime)}</span>
          </SettingsRow>
        )}
        {subscription && (
          <SettingsRow label="This month">
            <span>
              {new Intl.NumberFormat("en", {
                style: "currency",
                currency: "USD",
              }).format(contributedCents / 100)}
            </span>
          </SettingsRow>
        )}
        {subscription?.pendingChange && (
          <SettingsRow label="Pending amount">
            <span>USD {subscription.pendingChange.amount}</span>
            {subscription.pendingChange.approvalUrl ? (
              <a
                className={styles.link}
                href={subscription.pendingChange.approvalUrl}
              >
                Approve in PayPal
              </a>
            ) : (
              <SettingsInlineButton
                disabled={busy}
                onClick={() =>
                  void run("adjust", subscription.pendingChange!.amount)
                }
              >
                Continue in PayPal
              </SettingsInlineButton>
            )}
          </SettingsRow>
        )}
        <GoalDetailActions
          subscription={subscription}
          external={Boolean(goal.organization)}
          busy={busy}
          onSetup={onSetup}
          onDelete={deleteGoal}
          onCancel={() => run("cancel")}
        />
      </SettingsGroup>
      {(actions.error || error) && (
        <span className={styles.error} role="alert">
          {actions.error || error}
        </span>
      )}
    </div>
  );
}

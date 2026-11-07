import DeleteGoalButton from "./DeleteGoalButton";
import { useState } from "react";
import SettingsRow from "../settings/SettingsRow";
import SettingsActionRow from "../settings/SettingsActionRow";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import {
  canDeleteGoal,
  pendingApprovalPath,
  type GoalSubscription,
} from "../../lib/paypalSubscription";
import styles from "./GoalDetailActions.module.css";

export default function GoalDetailActions({
  name,
  subscription,
  external,
  busy,
  onSetup,
  onDelete,
  onCancel,
}: {
  name: string;
  subscription?: GoalSubscription;
  external: boolean;
  busy: boolean;
  onSetup: () => void;
  onDelete: () => Promise<void>;
  onCancel: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const cancellable =
    subscription &&
    ["ACTIVE", "SUSPENDED", "APPROVED"].includes(subscription.status);
  return (
    <>
      {!subscription && !external && (
        <SettingsRow label="Subscription">
          <SettingsInlineButton disabled={busy} onClick={onSetup}>
            Set up with PayPal
          </SettingsInlineButton>
        </SettingsRow>
      )}
      {subscription?.status === "APPROVAL_PENDING" &&
        subscription.approvalUrl && (
          <SettingsRow label="Approval">
            <a className={styles.link} href={pendingApprovalPath(subscription.goalId)}>
              Continue in PayPal
            </a>
          </SettingsRow>
        )}
      {subscription &&
        ["CANCELLED", "EXPIRED"].includes(subscription.status) && (
          <SettingsRow label="Subscription">
            <SettingsInlineButton disabled={busy} onClick={onSetup}>
              Renew with PayPal
            </SettingsInlineButton>
          </SettingsRow>
        )}
      {canDeleteGoal(subscription) && (
        <div className={styles.delete}>
          <DeleteGoalButton
            name={name}
            pendingApproval={subscription?.status === "APPROVAL_PENDING"}
            busy={busy}
            onDelete={onDelete}
          />
        </div>
      )}
      {cancellable &&
        (confirming ? (
          <SettingsRow label="Cancel subscription?">
            <SettingsInlineButton
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              Keep
            </SettingsInlineButton>
            <SettingsInlineButton
              disabled={busy}
              onClick={() => void onCancel().then(() => setConfirming(false))}
            >
              Cancel subscription
            </SettingsInlineButton>
          </SettingsRow>
        ) : (
          <SettingsActionRow
            disabled={busy}
            onClick={() => setConfirming(true)}
          >
            <span className={styles.danger}>Cancel subscription</span>
          </SettingsActionRow>
        ))}
    </>
  );
}

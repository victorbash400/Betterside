import { useState } from "react";
import SettingsRow from "../settings/SettingsRow";
import SettingsActionRow from "../settings/SettingsActionRow";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import {
  subscriptionLocked,
  type GoalSubscription,
} from "../../lib/paypalSubscription";
import styles from "./GoalDetailActions.module.css";

export default function GoalDetailActions({
  subscription,
  external,
  busy,
  onSetup,
  onDelete,
  onCancel,
}: {
  subscription?: GoalSubscription;
  external: boolean;
  busy: boolean;
  onSetup: () => void;
  onDelete: () => Promise<void>;
  onCancel: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const locked = Boolean(
    subscription && subscriptionLocked(subscription.status),
  );
  const cancellable =
    subscription &&
    ["ACTIVE", "SUSPENDED", "APPROVED"].includes(subscription.status);
  const label = locked ? "Cancel subscription" : "Remove goal";
  async function confirm() {
    if (locked) await onCancel();
    else await onDelete();
    setConfirming(false);
  }
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
            <a className={styles.link} href={subscription.approvalUrl}>
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
      {(!locked || cancellable) &&
        (confirming ? (
          <SettingsRow label={`${label}?`}>
            <SettingsInlineButton
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              Keep
            </SettingsInlineButton>
            <SettingsInlineButton
              disabled={busy}
              onClick={() => void confirm()}
            >
              {locked ? "Cancel subscription" : "Remove"}
            </SettingsInlineButton>
          </SettingsRow>
        ) : (
          <SettingsActionRow
            disabled={busy}
            onClick={() => setConfirming(true)}
          >
            <span className={styles.danger}>{label}</span>
          </SettingsActionRow>
        ))}
    </>
  );
}

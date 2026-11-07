import { ChevronRight, Flag } from "lucide-react";
import SettingsActionRow from "../settings/SettingsActionRow";
import type { ContributionGoal } from "../../lib/profile";
import DeleteGoalButton from "./DeleteGoalButton";
import { canDeleteGoal, type GoalSubscription } from "../../lib/paypalSubscription";
import styles from "./ContributionGoalRow.module.css";
const statuses: Record<GoalSubscription["status"], string> = {
  APPROVAL_PENDING: "Awaiting approval",
  APPROVED: "Approved",
  ACTIVE: "Active",
  SUSPENDED: "Paused",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};
export default function ContributionGoalRow({
  goal,
  subscription,
  onOpen,
  onDelete,
  busy,
}: {
  goal: ContributionGoal;
  subscription?: GoalSubscription;
  onOpen: () => void;
  onDelete: () => Promise<void>;
  busy: boolean;
}) {
  const name = goal.targetText || goal.category;
  const status = subscription ? statuses[subscription.status] : "Not set up";
  return (
    <div className={styles.entry}>
      <SettingsActionRow onClick={onOpen} disabled={busy}>
        <span className={styles.row}>
          <Flag size={18} aria-hidden="true" />
          <span className={styles.name}>
            <span>{name}</span>
            <small>
              {goal.category === name ? status : `${goal.category} · ${status}`}
            </small>
          </span>
          <span className={styles.amount}>
            {new Intl.NumberFormat("en", {
              style: "currency",
              currency: "USD",
            }).format(
              subscription ? Number(subscription.amount) : goal.targetCents / 100,
            )}
            {goal.period === "monthly" && <small>/ mo</small>}
          </span>
          <ChevronRight size={16} aria-hidden="true" />
        </span>
      </SettingsActionRow>
      {canDeleteGoal(subscription) && (
        <DeleteGoalButton
          name={name}
          pendingApproval={subscription?.status === "APPROVAL_PENDING"}
          busy={busy}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

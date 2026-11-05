import { ChevronRight, Flag } from "lucide-react";
import SettingsActionRow from "../settings/SettingsActionRow";
import type { ContributionGoal } from "../../lib/profile";
import type { GoalSubscription } from "../../lib/paypalSubscription";
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
}: {
  goal: ContributionGoal;
  subscription?: GoalSubscription;
  onOpen: () => void;
}) {
  const name = goal.targetText || goal.category;
  const status = subscription ? statuses[subscription.status] : "Not set up";
  return (
    <SettingsActionRow onClick={onOpen}>
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
  );
}

import { Pencil, Trash2 } from "lucide-react";
import IconButton from "../controls/IconButton";
import type { ContributionGoal } from "../../lib/profile";
import styles from "./ContributionGoalRow.module.css";
const money = (cents: number) =>
  new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(cents / 100);
export default function ContributionGoalRow({
  goal,
  cents,
  percent,
  busy,
  canContribute,
  onEdit,
  onDelete,
  onContribute,
}: {
  goal: ContributionGoal;
  cents: number;
  percent: number;
  busy: boolean;
  canContribute: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onContribute: () => void;
}) {
  return (
    <div className={styles.goal}>
      <div className={styles.heading}>
        <strong>{goal.category}</strong>
        <span>{goal.period === "monthly" ? "Monthly" : "One-time"}</span>
        <IconButton
          label={`Edit ${goal.category} goal`}
          disabled={busy}
          onClick={onEdit}
        >
          <Pencil size={14} />
        </IconButton>
        <IconButton
          label={`Delete ${goal.category} goal`}
          disabled={busy}
          onClick={onDelete}
        >
          <Trash2 size={14} />
        </IconButton>
      </div>
      <div
        className={styles.progress}
        role="progressbar"
        aria-label={`${goal.category} contribution goal`}
        aria-valuemin={0}
        aria-valuemax={goal.targetCents / 100}
        aria-valuenow={Math.min(cents, goal.targetCents) / 100}
        aria-valuetext={`${money(cents)} of ${money(goal.targetCents)}`}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className={styles.amounts}>
        <span>
          {money(cents)} / {money(goal.targetCents)}
        </span>
        {canContribute && (
          <button disabled={busy} onClick={onContribute}>
            Contribute
          </button>
        )}
      </div>
    </div>
  );
}

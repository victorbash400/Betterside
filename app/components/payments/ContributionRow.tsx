import { Heart, ChevronRight } from "lucide-react";
import { formatDate } from "../../lib/dates";
import type { Contribution } from "../../lib/types";
import styles from "./ContributionRow.module.css";
const statusLabels = {
  CREATED: "Awaiting payment",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};
export default function ContributionRow({
  record,
  onOpen,
}: {
  record: Contribution;
  onOpen: () => void;
}) {
  return (
    <button className={styles.row} onClick={onOpen}>
      <Heart size={22} strokeWidth={1.7} />
      <span className={styles.name}>
        {record.projectName}
        <small>Sandbox</small>
      </span>
      <span className={styles.date}>{formatDate(record.createdAt)}</span>
      <span className={styles.status}>{statusLabels[record.status]}</span>
      <span className={styles.amount}>
        {record.currency} {record.amount}
      </span>
      <ChevronRight size={14} />
    </button>
  );
}

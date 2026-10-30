import { concernIcons } from "./concernIcons";
import { Check } from "lucide-react";
import type { concerns } from "../../lib/concerns";
import styles from "./IssueLayerToggle.module.css";
export default function IssueLayerToggle({
  concern,
  selected,
  count,
  onToggle,
  color,
}: {
  concern: (typeof concerns)[number];
  selected: boolean;
  count: number;
  onToggle: () => void;
  color: string;
}) {
  const Icon = concernIcons[concern.id];
  return (
    <div className={styles.entry}>
      <button
        type="button"
        className={styles.row}
        aria-pressed={selected}
        onClick={onToggle}
      >
        <Icon
          size={16}
          aria-hidden="true"
          style={selected ? { color } : undefined}
        />
        <span>{concern.label}</span>
        <small aria-label={`${count} ${count === 1 ? "report" : "reports"}`}>
          {new Intl.NumberFormat("en", { notation: "compact" }).format(count)}
        </small>
        <Check size={13} className={styles.check} aria-hidden="true" />
      </button>
    </div>
  );
}

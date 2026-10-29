import { Map } from "lucide-react";
import { concernIcons } from "./concernIcons";
import type { concerns } from "../../lib/concerns";
import styles from "./IssueLayerToggle.module.css";
export default function IssueLayerToggle({
  concern,
  selected,
  count,
  onToggle,
  onAreas,
}: {
  concern: (typeof concerns)[number];
  selected: boolean;
  count: number;
  onToggle: () => void;
  onAreas?: () => void;
}) {
  const Icon = concernIcons[concern.id];
  return (
    <div className={styles.entry}>
      <button
        type="button"
        className={styles.row}
        title={concern.label}
        aria-pressed={selected}
        onClick={onToggle}
      >
        <Icon size={16} aria-hidden="true" />
        <span>{concern.label}</span>
        <small aria-label={`${count} reports`}>
          {new Intl.NumberFormat("en", { notation: "compact" }).format(count)}
        </small>
      </button>
      {onAreas && (
        <button
          className={styles.area}
          onClick={onAreas}
          title={`View ${concern.label} as reported areas`}
          aria-label={`View ${concern.label} as reported areas`}
        >
          <Map size={14} />
          <span>Areas</span>
        </button>
      )}
    </div>
  );
}

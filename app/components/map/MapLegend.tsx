import type { Filters } from "../../lib/types";
import styles from "./MapLegend.module.css";
export default function MapLegend({
  metric,
  onMetric,
}: {
  metric: Filters["metric"];
  onMetric: (metric: Filters["metric"]) => void;
}) {
  return (
    <div className={styles.legend}>
      <div role="group" aria-label="Map data layer">
        {(["Severity", "Funding gap", "Freshness"] as const).map((value) => (
          <button
            key={value}
            aria-pressed={metric === value}
            onClick={() => onMetric(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <span>
        <i />
        {metric === "Severity"
          ? "Hollow marker · insufficient data"
          : metric === "Freshness"
            ? "Undated reports · freshness unknown"
            : "Marker size · sandbox funding gap"}
      </span>
    </div>
  );
}

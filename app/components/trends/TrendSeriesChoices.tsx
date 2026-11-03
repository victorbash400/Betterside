import SettingsGroup from "../settings/SettingsGroup";
import { Check } from "lucide-react";
import type { TrendSeries } from "../../lib/trends";
import styles from "./TrendSeriesChoices.module.css";
export default function TrendSeriesChoices({
  series,
  selected,
  onChange,
}: {
  series: TrendSeries[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div className={styles.choices} role="group" aria-label="Compare series">
      <SettingsGroup>
      {series.map((item) => (
        <button
          key={item.id}
          role="checkbox"
          aria-checked={selected.includes(item.id)}
          onClick={() =>
            onChange(
              selected.includes(item.id)
                ? selected.filter((id) => id !== item.id)
                : [...selected, item.id],
            )
          }
        >
          <span className={styles.check}>
            {selected.includes(item.id) && <Check size={11} />}
          </span>
          <span>
            {item.label}
            <small>
              {item.source} · {item.points.length} observations
            </small>
          </span>
        </button>
      ))}
      </SettingsGroup>
    </div>
  );
}

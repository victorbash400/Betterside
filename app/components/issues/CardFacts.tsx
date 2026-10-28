import type { ReactNode } from "react";
import styles from "./CardFacts.module.css";
export default function CardFacts({
  entries,
}: {
  entries: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className={styles.facts}>
      {entries.map((entry) => (
        <div key={entry.label}>
          <dt>{entry.label}</dt>
          <dd>{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}

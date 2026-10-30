import { Check } from "lucide-react";
import styles from "./OrganizationCauseOptions.module.css";

export default function OrganizationCauseOptions({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (topics: string[]) => void;
}) {
  return (
    <ul className={styles.list} aria-label="Organization cause selection">
      {options.map((topic) => (
        <li key={topic}>
          <button
            className={styles.issue}
            aria-pressed={value.includes(topic)}
            onClick={() =>
              onChange(
                value.includes(topic)
                  ? value.filter((item) => item !== topic)
                  : [...value, topic],
              )
            }
          >
            {topic}
            {value.includes(topic) && <Check size={13} aria-hidden="true" />}
          </button>
        </li>
      ))}
    </ul>
  );
}

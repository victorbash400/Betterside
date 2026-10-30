import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  organizationTopics,
  type DirectoryOrganization,
} from "../../lib/organizations";
import { useNarrowLayout } from "../../state/useNarrowLayout";
import styles from "./OrganizationIssues.module.css";
export default function OrganizationIssues({
  organization,
  value,
  onChange,
}: {
  organization?: DirectoryOrganization;
  value: string;
  onChange: (topic: string) => void;
}) {
  const narrow = useNarrowLayout();
  const [expanded, setExpanded] = useState<boolean>();
  const open = expanded ?? !narrow;
  return (
    <aside
      className={styles.panel}
      data-open={open}
      aria-label="Organization causes"
    >
      <button
        className={styles.heading}
        aria-expanded={open}
        onClick={() => setExpanded(!open)}
      >
        Causes {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <ul className={styles.list}>
          {organizationTopics.map((topic) => {
            const covered = organization?.topics.includes(topic) ?? false;
            return (
              <li key={topic}>
                <button
                  className={styles.issue}
                  data-covered={covered}
                  aria-pressed={value === topic}
                  onClick={() => onChange(value === topic ? "" : topic)}
                >
                  {topic}
                  {value === topic && <Check size={13} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

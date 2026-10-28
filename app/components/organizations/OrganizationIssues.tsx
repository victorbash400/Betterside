import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  organizationTopics,
  type DirectoryOrganization,
} from "../../lib/organizations";
import { useNarrowLayout } from "../../state/useNarrowLayout";
import styles from "./OrganizationIssues.module.css";
export default function OrganizationIssues({
  organization,
}: {
  organization?: DirectoryOrganization;
}) {
  const narrow = useNarrowLayout();
  const [expanded, setExpanded] = useState<boolean>();
  const open = expanded ?? !narrow;
  return (
    <aside
      className={styles.panel}
      data-open={open}
      aria-label="Organization issues"
    >
      <button
        className={styles.heading}
        aria-expanded={open}
        onClick={() => setExpanded(!open)}
      >
        Issues {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <ul className={styles.list}>
          {organizationTopics.map((topic) => {
            const covered = organization?.topics.includes(topic) ?? false;
            return (
              <li
                key={topic}
                className={styles.issue}
                data-covered={covered}
                aria-label={
                  organization
                    ? `${topic}: ${covered ? "reported focus" : "not reported"}`
                    : topic
                }
              >
                {topic}
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

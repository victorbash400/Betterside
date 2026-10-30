import { ArrowLeft, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  organizationCauseTopics,
  type DirectoryOrganization,
} from "../../lib/organizations";
import { useNarrowLayout } from "../../state/useNarrowLayout";
import IconButton from "../controls/IconButton";
import styles from "./OrganizationIssues.module.css";
export default function OrganizationIssues({
  organization,
  value,
  onChange,
  onClearOrganization,
}: {
  organization?: DirectoryOrganization;
  value: string;
  onChange: (topic: string) => void;
  onClearOrganization: () => void;
}) {
  const narrow = useNarrowLayout();
  const [expanded, setExpanded] = useState<boolean>();
  const open = expanded ?? !narrow;
  const topics = organizationCauseTopics(organization);
  return (
    <aside
      className={styles.panel}
      data-open={open}
      aria-label={
        organization ? `Causes for ${organization.name}` : "Organization causes"
      }
    >
      <div className={styles.header}>
        {organization && (
          <IconButton
            label="All causes"
            title="Clear organization selection"
            onClick={onClearOrganization}
          >
            <ArrowLeft size={14} />
          </IconButton>
        )}
        <button
          className={styles.heading}
          aria-expanded={open}
          onClick={() => setExpanded(!open)}
        >
          <span>Causes</span>
          <small>{topics.length}</small>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {open && (
        <ul className={styles.list}>
          {topics.map((topic) => (
            <li key={topic}>
              <button
                className={styles.issue}
                aria-pressed={value === topic}
                onClick={() => onChange(value === topic ? "" : topic)}
              >
                {topic}
                {value === topic && <Check size={13} aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

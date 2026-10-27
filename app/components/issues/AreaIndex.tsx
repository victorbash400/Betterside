import { useState } from "react";
import { List, X } from "lucide-react";
import type { Issue } from "../../lib/types";
import IssueRow from "./IssueRow";
import styles from "./AreaIndex.module.css";
export default function AreaIndex({
  issues,
  selectedId,
  onSelect,
}: {
  issues: Issue[];
  selectedId?: string;
  onSelect: (issue: Issue) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={styles.toggle}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <List size={14} />
        Areas<span>{issues.length}</span>
      </button>
      <section
        className={`${styles.index} ${open ? styles.open : ""}`}
        aria-label="Areas"
      >
        <div className={styles.heading}>
          <span>Areas</span>
          <span>{issues.length}</span>
          <button
            className={styles.close}
            aria-label="Close areas"
            onClick={() => setOpen(false)}
          >
            <X size={15} />
          </button>
        </div>
        <div className={styles.list}>
          {issues.map((issue) => (
            <IssueRow
              key={issue.id}
              issue={issue}
              selected={selectedId === issue.id}
              onSelect={() => {
                onSelect(issue);
                setOpen(false);
              }}
            />
          ))}
        </div>
      </section>
    </>
  );
}

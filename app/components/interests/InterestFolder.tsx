import { useState } from "react";
import { Folder, FolderOpen, FileText, ChevronRight } from "lucide-react";
import type { Issue } from "../../lib/types";
import type { Interest } from "../../state/useTracking";
import styles from "./InterestFolder.module.css";
export default function InterestFolder({
  interest,
  issues,
  selected,
  active,
  onSelect,
  onOpen,
}: {
  interest: Interest;
  issues: Issue[];
  selected?: string;
  active: boolean;
  onSelect: (issue: Issue) => void;
  onOpen: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div>
      <div className={`${styles.folder} ${active ? styles.selected : ""}`}>
        <button
          className={styles.chevron}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${interest.name}`}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          <ChevronRight
            size={12}
            style={expanded ? { transform: "rotate(90deg)" } : undefined}
          />
        </button>
        <button
          className={styles.name}
          onClick={() => {
            setExpanded(true);
            onOpen();
          }}
        >
          {expanded ? (
            <FolderOpen size={24} strokeWidth={1.8} />
          ) : (
            <Folder size={24} strokeWidth={1.8} />
          )}
          <span>{interest.name}</span>
        </button>
      </div>
      {expanded &&
        issues.map((issue) => (
          <button
            key={issue.id}
            className={`${styles.file} ${selected === issue.id ? styles.selected : ""}`}
            title={`${issue.location} · ${issue.kind}`}
            onClick={() => onSelect(issue)}
          >
            <FileText size={20} strokeWidth={1.8} />
            <span>
              {issue.location} · {issue.kind}
            </span>
          </button>
        ))}
    </div>
  );
}

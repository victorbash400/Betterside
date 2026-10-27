import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import IconButton from "../controls/IconButton";
import InterestFolder from "./InterestFolder";
import NewInterestDialog from "./NewInterestDialog";
import type { Interest } from "../../state/useTracking";
import type { Issue } from "../../lib/types";
import styles from "./InterestList.module.css";
export default function InterestList({
  interests,
  following,
  issues,
  selected,
  activeId,
  onSelect,
  onOpen,
  onCreate,
}: {
  interests: Interest[];
  following: string[];
  issues: Issue[];
  selected?: string;
  activeId?: string;
  onSelect: (issue: Issue) => void;
  onOpen: (id: string) => void;
  onCreate: (name: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const grouped = new Set(interests.flatMap((interest) => interest.issueIds));
  return (
    <>
      <div className={styles.header}>
        <span>Interests</span>
        <IconButton
          label="New interest"
          title="New interest"
          onClick={() => setCreating(true)}
        >
          <Plus />
        </IconButton>
      </div>
      {interests.map((interest) => (
        <InterestFolder
          key={interest.id}
          interest={interest}
          issues={issues.filter((issue) =>
            interest.issueIds.includes(issue.id),
          )}
          selected={selected}
          active={activeId === interest.id}
          onSelect={onSelect}
          onOpen={() => onOpen(interest.id)}
        />
      ))}
      {issues
        .filter(
          (issue) => following.includes(issue.id) && !grouped.has(issue.id),
        )
        .map((issue) => (
          <button
            key={issue.id}
            className={`${styles.file} ${selected === issue.id ? styles.selected : ""}`}
            onClick={() => onSelect(issue)}
            title={`${issue.location} · ${issue.kind}`}
          >
            <FileText size={24} strokeWidth={1.8} />
            <span>
              {issue.location} · {issue.kind}
            </span>
          </button>
        ))}
      {creating && (
        <NewInterestDialog
          onClose={() => setCreating(false)}
          onCreate={(name) => {
            onCreate(name);
            setCreating(false);
          }}
        />
      )}
    </>
  );
}

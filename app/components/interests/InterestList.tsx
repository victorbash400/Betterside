import {
  interestOrder,
  type InterestChoice,
} from "../../lib/interestCategories";
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
  disabled,
  following,
  issues,
  selected,
  activeId,
  onSelect,
  onOpen,
  onCreate,
}: {
  interests: Interest[];
  disabled?: boolean;
  following: string[];
  issues: Issue[];
  selected?: string;
  activeId?: string;
  onSelect: (issue: Issue) => void;
  onOpen: (id: string) => void;
  onCreate: (choice: InterestChoice) => void;
}) {
  const [creating, setCreating] = useState(false);
  const grouped = new Set(interests.flatMap((interest) => interest.issueIds));
  return (
    <>
      <div className={styles.header}>
        <span>Interests</span>
        <IconButton
          disabled={disabled}
          label="New interest"
          title="New interest"
          onClick={() => setCreating(true)}
        >
          <Plus />
        </IconButton>
      </div>
      {interests.toSorted(interestOrder).map((interest) => (
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
          interests={interests}
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

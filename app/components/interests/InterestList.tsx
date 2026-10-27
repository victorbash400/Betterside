import { interestPath } from "../../lib/interestTree";
import type { InterestAction } from "../../lib/interestActions";
import TrackedItem from "./TrackedItem";
import {
  interestOrder,
  type InterestChoice,
} from "../../lib/interestCategories";
import { useState } from "react";
import { Plus } from "lucide-react";
import IconButton from "../controls/IconButton";
import InterestFolder from "./InterestFolder";
import NewInterestDialog from "./NewInterestDialog";
import type { Interest } from "../../state/useTracking";
import type { MapItem as Issue } from "../../lib/types";
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
  onAction,
  onTrack,
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
  onAction: (action: InterestAction) => void;
  onTrack: (id: string, interestId?: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const grouped = new Set(interests.flatMap((interest) => interest.issueIds));
  function renderFolder(interest: Interest, depth: number): React.ReactNode {
    return (
      <InterestFolder
        key={interest.id}
        interest={interest}
        issues={issues.filter((issue) => interest.issueIds.includes(issue.id))}
        selected={selected}
        active={activeId === interest.id}
        reveal={interestPath(interests, activeId).some(
          (item) => item.id === interest.id,
        )}
        onSelect={onSelect}
        onOpen={() => onOpen(interest.id)}
        onAction={onAction}
        onDropItem={(id) => onTrack(id, interest.id)}
        depth={depth}
      >
        {interests
          .filter((child) => child.parentId === interest.id)
          .toSorted(interestOrder)
          .map((child) => renderFolder(child, depth + 1))}
      </InterestFolder>
    );
  }
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
      {interests
        .filter((interest) => !interest.parentId)
        .toSorted(interestOrder)
        .map((interest) => renderFolder(interest, 0))}
      {issues
        .filter(
          (issue) => following.includes(issue.id) && !grouped.has(issue.id),
        )
        .map((issue) => (
          <TrackedItem
            key={issue.id}
            item={issue}
            selected={selected === issue.id}
            onSelect={() => onSelect(issue)}
            onAction={onAction}
            depth={0}
          />
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

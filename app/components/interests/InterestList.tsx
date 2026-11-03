import { comparablePins } from "../../lib/pins";
import { interestPath } from "../../lib/interestTree";
import type { InterestAction } from "../../lib/interestActions";
import TrackedItem from "./TrackedItem";
import { interestOrder } from "../../lib/interestCategories";
import { Plus, ChartNoAxesCombined } from "lucide-react";
import IconButton from "../controls/IconButton";
import PinnedShortcut from "./PinnedShortcut";
import InterestFolder from "./InterestFolder";
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
  onRequestPin,
  onComparePins,
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
  onRequestPin: () => void;
  onComparePins: () => void;
  onAction: (action: InterestAction) => void;
  onTrack: (id: string, interestId?: string) => void;
}) {
  const comparisonCount = comparablePins(
    [
      ...interests,
      ...issues
        .filter((item) => following.includes(item.id))
        .map((item) => ({
          id: item.id,
          name: item.location,
          issueIds: [item.id],
          hiddenKinds: [],
        })),
    ],
    issues,
  ).length;
  const grouped = new Set(interests.flatMap((interest) => interest.issueIds));
  function renderFolder(interest: Interest, depth: number): React.ReactNode {
    if (interest.target)
      return (
        <PinnedShortcut
          key={interest.id}
          pin={interest}
          active={activeId === interest.id}
          onOpen={() => onOpen(interest.id)}
          onUnpin={() => onAction({ kind: "archive", interest })}
        />
      );
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
        <span>Pinned</span>
        <div className={styles.headerActions}>
          <IconButton
            label="Compare pins"
            title="Compare pins"
            disabled={disabled || comparisonCount < 2}
            onClick={onComparePins}
          >
            <ChartNoAxesCombined />
          </IconButton>
          <IconButton
            disabled={disabled}
            label="Pin"
            title="Pin"
            onClick={onRequestPin}
          >
            <Plus />
          </IconButton>
        </div>
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
    </>
  );
}

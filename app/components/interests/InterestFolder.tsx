import { useEffect, useState } from "react";
import {
  FolderClosed,
  FolderOpen,
  ChevronRight,
  Plus,
  Ellipsis,
} from "lucide-react";
import IconButton from "../controls/IconButton";
import TrackedItem from "./TrackedItem";
import InterestContextMenu from "./InterestContextMenu";
import { categoryPath } from "../../lib/interestCategories";
import type { Interest } from "../../lib/tracking";
import type { MapItem as Issue } from "../../lib/types";
import type { InterestAction } from "../../lib/interestActions";
import styles from "./InterestFolder.module.css";
export default function InterestFolder({
  interest,
  issues,
  selected,
  active,
  reveal,
  onSelect,
  onOpen,
  onAction,
  children,
  depth = 0,
  onDropItem,
}: {
  interest: Interest;
  issues: Issue[];
  selected?: string;
  active: boolean;
  reveal?: boolean;
  onSelect: (issue: Issue) => void;
  onOpen: () => void;
  onAction: (action: InterestAction) => void;
  children?: React.ReactNode;
  depth?: number;
  onDropItem: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false),
    [menu, setMenu] = useState<{ x: number; y: number } | null>(null),
    [dragOver, setDragOver] = useState(false);
  useEffect(() => {
    if (reveal) setExpanded(true);
  }, [reveal]);
  const Icon = expanded ? FolderOpen : FolderClosed;
  return (
    <div>
      <div
        className={`${styles.row} ${active ? styles.selected : ""}`}
        style={{ marginLeft: depth * 20 }}
        data-drag-over={dragOver ? true : undefined}
        onDragOver={(event) => {
          if (
            event.dataTransfer.types.includes("application/betterside-item")
          ) {
            event.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          const id = event.dataTransfer.getData("application/betterside-item");
          if (id) onDropItem(id);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setMenu({ x: event.clientX, y: event.clientY });
        }}
      >
        <button
          className={`${styles.toggle} ${expanded ? styles.expanded : ""}`}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${interest.name}`}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          <ChevronRight size={14} />
        </button>
        <button
          className={styles.label}
          title={categoryPath(interest.categoryId) || interest.name}
          aria-current={active ? "page" : undefined}
          onClick={() => {
            setExpanded(true);
            onOpen();
          }}
        >
          <Icon size={24} strokeWidth={1.7} />
          <span>{interest.name}</span>
        </button>
        <div className={styles.actions}>
          <IconButton
            label={`Add items to ${interest.name}`}
            onClick={() => onAction({ kind: "add", interest })}
          >
            <Plus />
          </IconButton>
          <IconButton
            label={`${interest.name} actions`}
            aria-haspopup="menu"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setMenu({ x: rect.left, y: rect.bottom });
            }}
          >
            <Ellipsis />
          </IconButton>
        </div>
      </div>
      {expanded && (
        <>
          {children}
          {issues.map((issue) => (
            <TrackedItem
              key={issue.id}
              item={issue}
              interestId={interest.id}
              selected={selected === issue.id}
              onSelect={() => onSelect(issue)}
              onAction={onAction}
              depth={depth + 1}
            />
          ))}
        </>
      )}
      {menu && (
        <InterestContextMenu
          {...menu}
          interest={interest}
          onAction={onAction}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}

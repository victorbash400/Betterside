import { useState } from "react";
import { FileText, Ellipsis } from "lucide-react";
import IconButton from "../controls/IconButton";
import InterestContextMenu from "./InterestContextMenu";
import type { MapItem } from "../../lib/types";
import type { InterestAction } from "../../lib/interestActions";
import styles from "./TrackedItem.module.css";
export default function TrackedItem({
  item,
  selected,
  onSelect,
  onAction,
  depth = 1,
  interestId,
}: {
  item: MapItem;
  selected: boolean;
  onSelect: () => void;
  onAction: (action: InterestAction) => void;
  depth?: number;
  interestId?: string;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  return (
    <>
      <div
        draggable
        onDragStart={(event) =>
          event.dataTransfer.setData("application/betterside-item", item.id)
        }
        className={`${styles.row} ${selected ? styles.selected : ""}`}
        style={{ marginLeft: depth * 20 }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setMenu({ x: event.clientX, y: event.clientY });
        }}
      >
        <button
          className={styles.label}
          onClick={onSelect}
          title={item.location}
        >
          <FileText size={24} strokeWidth={1.7} />
          <span>{item.location}</span>
        </button>
        <IconButton
          label={`${item.location} actions`}
          aria-haspopup="menu"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setMenu({ x: rect.left, y: rect.bottom });
          }}
        >
          <Ellipsis />
        </IconButton>
      </div>
      {menu && (
        <InterestContextMenu
          {...menu}
          item={item}
          interestId={interestId}
          onAction={onAction}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  );
}

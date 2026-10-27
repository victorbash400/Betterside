import { useState } from "react";
import { FileText, Ellipsis } from "lucide-react";
import IconButton from "../controls/IconButton";
import InterestContextMenu from "../interests/InterestContextMenu";
import { formatDate } from "../../lib/dates";
import type { MapItem } from "../../lib/types";
import type { InterestAction } from "../../lib/interestActions";
import styles from "./CollectionItemRow.module.css";
export default function CollectionItemRow({
  item,
  folder,
  interestId,
  onSelect,
  onAction,
}: {
  item: MapItem;
  folder?: string;
  interestId?: string;
  onSelect: () => void;
  onAction: (action: InterestAction) => void;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  return (
    <>
      <div
        className={styles.row}
        draggable
        onDragStart={(event) =>
          event.dataTransfer.setData("application/betterside-item", item.id)
        }
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setMenu({ x: event.clientX, y: event.clientY });
        }}
      >
        <button className={styles.name} onClick={onSelect}>
          <FileText size={24} strokeWidth={1.7} />
          <span>
            {item.location}
            <small>{folder ?? item.source.label}</small>
          </span>
        </button>
        <span className={styles.date}>{formatDate(item.source.published)}</span>
        <span className={styles.kind}>{item.kind}</span>
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

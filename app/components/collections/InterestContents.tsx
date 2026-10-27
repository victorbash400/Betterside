import ContextMenu from "../controls/ContextMenu";
import InterestContextMenu from "../interests/InterestContextMenu";
import { useState } from "react";
import { Plus } from "lucide-react";
import CollectionItemRow from "./CollectionItemRow";
import type { Interest } from "../../lib/tracking";
import type { MapItem } from "../../lib/types";
import type { InterestAction } from "../../lib/interestActions";
import styles from "./InterestContents.module.css";
export default function InterestContents({
  interest,
  discovery = false,
  interests,
  items,
  onAdd,
  onSelect,
  onAction,
  canEdit,
}: {
  interest?: Interest;
  discovery?: boolean;
  interests: Interest[];
  items: MapItem[];
  onAdd: () => void;
  onSelect: (item: MapItem) => void;
  onAction: (action: InterestAction) => void;
  canEdit: boolean;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const sorted = items.toSorted((a, b) => a.location.localeCompare(b.location));

  return (
    <section
      className={styles.collection}
      aria-label={
        interest
          ? `${interest.name} contents`
          : discovery
            ? "Data contents"
            : "Following contents"
      }
      onContextMenu={(event) => {
        if (event.defaultPrevented || !canEdit) return;
        if (
          event.target instanceof Element &&
          event.target.closest("button,a,input")
        )
          return;
        event.preventDefault();
        setMenu({ x: event.clientX, y: event.clientY });
      }}
    >
      <div className={styles.scroll}>
        <div className={styles.header}>
          <span>Name</span>
          <span>Date updated</span>
          <span>Issue</span>
          <span />
        </div>
        {sorted.map((item) => (
          <CollectionItemRow
            key={item.id}
            item={item}
            interestId={interest?.id}
            folder={
              !interest && !discovery
                ? interests.find((folder) => folder.issueIds.includes(item.id))
                    ?.name
                : undefined
            }
            onSelect={() => onSelect(item)}
            onAction={onAction}
          />
        ))}
      </div>
      {menu &&
        (interest ? (
          <InterestContextMenu
            {...menu}
            interest={interest}
            onAction={onAction}
            onClose={() => setMenu(null)}
          />
        ) : (
          <ContextMenu
            {...menu}
            label="Contents actions"
            entries={[{ label: "Add items…", icon: Plus, action: onAdd }]}
            onClose={() => setMenu(null)}
          />
        ))}
    </section>
  );
}

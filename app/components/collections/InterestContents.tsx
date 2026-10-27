import ContextMenu from "../controls/ContextMenu";
import InterestContextMenu from "../interests/InterestContextMenu";
import { useState } from "react";
import { Plus } from "lucide-react";
import CollectionToolbar from "./CollectionToolbar";
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
  const [sort, setSort] = useState<"name" | "date">("name");
  const sorted = items.toSorted((a, b) =>
    sort === "name"
      ? a.location.localeCompare(b.location)
      : (Date.parse(b.source.published ?? "") || 0) -
        (Date.parse(a.source.published ?? "") || 0),
  );

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
        if (event.defaultPrevented) return;
        if (
          event.target instanceof Element &&
          event.target.closest("button,a,input")
        )
          return;
        event.preventDefault();
        setMenu({ x: event.clientX, y: event.clientY });
      }}
    >
      <CollectionToolbar
        count={items.length}
        onAdd={onAdd}
        sort={sort}
        onSort={() => setSort((value) => (value === "name" ? "date" : "name"))}
        canEdit={canEdit}
      />
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

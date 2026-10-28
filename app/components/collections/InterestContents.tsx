import ContextMenu from "../controls/ContextMenu";
import InterestContextMenu from "../interests/InterestContextMenu";
import { useState } from "react";
import { Plus } from "lucide-react";
import RecordPagination from "./RecordPagination";
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
  const [requestedPage, setPage] = useState(0);
  const pageSize = 100, pages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requestedPage, pages - 1);
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
        {sorted.slice(page * pageSize, (page + 1) * pageSize).map((item) => (
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
      {pages > 1 && <RecordPagination page={page} pages={pages} onPage={setPage} />}
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

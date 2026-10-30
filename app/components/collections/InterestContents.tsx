import ContextMenu from "../controls/ContextMenu";
import InterestContextMenu from "../interests/InterestContextMenu";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import DataGrid from "../grid/DataGrid";
import { recordColumns } from "./recordColumns";
import type { Interest } from "../../lib/tracking";
import type { MapItem } from "../../lib/types";
import type { InterestAction } from "../../lib/interestActions";
import styles from "./InterestContents.module.css";
export default function InterestContents({
  interest,
  discovery = false,
  items,
  onAdd,
  onSelect,
  onAction,
  canEdit,
}: {
  interest?: Interest;
  discovery?: boolean;
  items: MapItem[];
  onAdd: () => void;
  onSelect: (item: MapItem) => void;
  onAction: (action: InterestAction) => void;
  canEdit: boolean;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [itemMenu, setItemMenu] = useState<{
    item: MapItem;
    x: number;
    y: number;
  }>();
  const columns = useMemo(
    () => recordColumns((item, position) => setItemMenu({ item, ...position })),
    [],
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
      <DataGrid
        label="Cause records"
        rows={items}
        columns={columns}
        onOpen={onSelect}
        onContextMenu={(item, event) =>
          setItemMenu({ item, x: event.clientX, y: event.clientY })
        }
      />
      {itemMenu && (
        <InterestContextMenu
          {...itemMenu}
          interestId={interest?.id}
          onAction={onAction}
          onClose={() => setItemMenu(undefined)}
        />
      )}
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

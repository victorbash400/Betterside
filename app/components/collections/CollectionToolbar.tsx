import { Plus, ArrowDownAZ, ArrowDownWideNarrow } from "lucide-react";
import IconButton from "../controls/IconButton";
import styles from "./CollectionToolbar.module.css";
export default function CollectionToolbar({
  count,
  onAdd,
  onSort,
  sort,
  canEdit,
}: {
  count: number;
  onAdd: () => void;
  onSort: () => void;
  sort: "name" | "date";
  canEdit: boolean;
}) {
  return (
    <div className={styles.toolbar}>
      <span className={styles.count}>
        {count} {count === 1 ? "record" : "records"}
      </span>
      <div className={styles.actions}>
        <IconButton
          label={sort === "name" ? "Sort by date" : "Sort by name"}
          title={sort === "name" ? "Sort by date" : "Sort by name"}
          onClick={onSort}
        >
          {sort === "name" ? <ArrowDownAZ /> : <ArrowDownWideNarrow />}
        </IconButton>
        <button className={styles.add} onClick={onAdd} disabled={!canEdit}>
          <Plus size={16} />
          Add items
        </button>
      </div>
    </div>
  );
}

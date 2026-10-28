import { filterIssues, issueKinds } from "../../lib/catalogue";
import { useEffect, useRef, useState } from "react";
import { Search, FileText } from "lucide-react";
import Dialog from "../controls/Dialog";
import { interestCategories } from "../../lib/interestCategories";
import type { Interest } from "../../lib/tracking";
import type { MapItem } from "../../lib/types";
import styles from "./AddItemsDialog.module.css";
export default function AddItemsDialog({
  interest,
  items,
  onAdd,
  onClose,
}: {
  interest?: Interest;
  items: MapItem[];
  onAdd: (items: MapItem[]) => void;
  onClose: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
  }, []);
  const category = interestCategories.find(
    (item) => item.id === interest?.categoryId,
  );
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState(new Set<string>());
  const matches = filterIssues(items, {
    query,
    kinds: [...issueKinds],
    metric: "Freshness",
  }).toSorted(
    (a, b) =>
      Number(b.kind === category?.issueKind) -
        Number(a.kind === category?.issueKind) ||
      a.location.localeCompare(b.location),
  );
  return (
    <Dialog
      title={interest ? `Add to ${interest.name}` : "Add to Following"}
      onClose={onClose}
    >
      <div className={styles.surface}>
        <label className={styles.search}>
          <Search size={16} />
          <input
            ref={input}
            autoFocus
            aria-label="Search items to add"
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className={styles.list}>
          {matches.map((item) => {
            const added = interest?.issueIds.includes(item.id);
            return (
              <button
                key={item.id}
                role="checkbox"
                aria-checked={selected.has(item.id) || Boolean(added)}
                disabled={added}
                className={styles.row}
                onClick={() =>
                  setSelected((previous) => {
                    const next = new Set(previous);
                    if (next.has(item.id)) next.delete(item.id);
                    else next.add(item.id);
                    return next;
                  })
                }
              >
                <FileText size={20} />
                <span>
                  {item.location}
                  <small>
                    {item.source.label}
                    <span className={styles.kind}>{item.kind}</span>
                  </small>
                </span>
                {added && <small>Added</small>}
              </button>
            );
          })}
        </div>
        <div className={styles.actions}>
          <button onClick={onClose}>Cancel</button>
          <button
            disabled={!selected.size}
            onClick={() => onAdd(items.filter((item) => selected.has(item.id)))}
          >
            Add{selected.size ? ` ${selected.size}` : ""}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

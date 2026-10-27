import { useState } from "react";
import { Check, SlidersHorizontal, ChevronDown } from "lucide-react";
import { issueKinds } from "../../lib/catalogue";
import ContextMenu from "../controls/ContextMenu";
import type { Filters } from "../../lib/types";
import styles from "./IssueFilters.module.css";
export default function IssueFilters({
  filters,
  onChange,
  count,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  count: number;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  return (
    <header className={styles.header}>
      <div className={styles.searchRow}>
        <button
          type="button"
          className={styles.control}
          aria-haspopup="menu"
          aria-expanded={Boolean(menu)}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setMenu(menu ? null : { x: rect.left, y: rect.bottom + 6 });
          }}
        >
          <SlidersHorizontal size={16} />
          <span>
            Issues{filters.kinds.length ? ` · ${filters.kinds.length}` : ""}
          </span>
          <ChevronDown size={13} />
        </button>
        <span className={styles.count}>{count} areas</span>
      </div>
      {menu && (
        <ContextMenu
          {...menu}
          label="Issue filters"
          entries={issueKinds.map((kind) => ({
            label: kind,
            icon: filters.kinds.includes(kind) ? Check : undefined,
            action: () =>
              onChange({
                ...filters,
                kinds: filters.kinds.includes(kind)
                  ? filters.kinds.filter((value) => value !== kind)
                  : [...filters.kinds, kind],
              }),
          }))}
          onClose={() => setMenu(null)}
        />
      )}
    </header>
  );
}

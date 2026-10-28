import { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { MapItem } from "../../lib/types";
import IconButton from "../controls/IconButton";
import styles from "./MapRecordPicker.module.css";
export default function MapRecordPicker({ items, onSelect, onClose }: {
  items: MapItem[]; onSelect: (item: MapItem) => void; onClose: () => void;
}) {
  const [page, setPage] = useState(0), size = 30;
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    root.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  return (
    <aside ref={root} className={styles.picker} aria-label="Records at this location" onKeyDown={(event) => {
      if (event.key === "Escape") { event.stopPropagation(); onClose(); }
    }}>
      <div className={styles.toolbar}>
        <span>{items.length} records</span>
        <IconButton label="Close location records" onClick={onClose}><X /></IconButton>
      </div>
      <div className={styles.items}>
        {items.slice(page * size, (page + 1) * size).map((item) => (
          <button key={item.id} onClick={() => onSelect(item)}>
            {item.location}<small>{item.source.label}</small>
          </button>
        ))}
      </div>
      {items.length > size && <div className={styles.toolbar}>
        <IconButton label="Previous records" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><ChevronLeft /></IconButton>
        <span>{page + 1} / {Math.ceil(items.length / size)}</span>
        <IconButton label="Next records" disabled={(page + 1) * size >= items.length} onClick={() => setPage((value) => value + 1)}><ChevronRight /></IconButton>
      </div>}
    </aside>
  );
}

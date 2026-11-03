import { Check } from "lucide-react";
import type { CustomCellRendererProps } from "ag-grid-react";
import type { MapLayerRow } from "./MapLayerGrid";
import styles from "./MapLayerSelectionCell.module.css";
export default function MapLayerSelectionCell({
  data,
  value,
  onToggle,
}: CustomCellRendererProps<MapLayerRow, boolean> & {
  onToggle: (id: string) => void;
}) {
  if (!data) return null;
  return (
    <button
      className={styles.checkbox}
      role="checkbox"
      aria-checked={Boolean(value)}
      aria-label={`Select ${data.label}`}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(data.id);
      }}
    >
      {value && <Check size={12} strokeWidth={2.5} />}
    </button>
  );
}

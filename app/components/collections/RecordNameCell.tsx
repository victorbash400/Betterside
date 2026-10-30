import { FileText } from "lucide-react";
import type { CustomCellRendererProps } from "ag-grid-react";
import type { MapItem } from "../../lib/types";
import styles from "./RecordNameCell.module.css";

export default function RecordNameCell({
  data,
}: CustomCellRendererProps<MapItem>) {
  if (!data) return null;
  return (
    <span
      className={styles.name}
      draggable
      onDragStart={(event) =>
        event.dataTransfer.setData("application/betterside-item", data.id)
      }
    >
      <FileText size={19} strokeWidth={1.7} />
      <span>
        {data.location}
        <small>{data.source.label}</small>
      </span>
    </span>
  );
}

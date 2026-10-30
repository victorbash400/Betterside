import type { CustomCellRendererProps } from "ag-grid-react";
import type { MapItem } from "../../lib/types";
export default function ChatRecordSourceCell({
  data,
}: CustomCellRendererProps<MapItem>) {
  return data ? (
    <a href={data.source.url} target="_blank" rel="noreferrer">
      {data.source.label}
    </a>
  ) : null;
}

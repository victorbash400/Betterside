import { Ellipsis } from "lucide-react";
import type { CustomCellRendererProps } from "ag-grid-react";
import type { MapItem } from "../../lib/types";
import IconButton from "../controls/IconButton";

export default function RecordActionsCell({
  data,
  onMenu,
}: CustomCellRendererProps<MapItem> & {
  onMenu: (item: MapItem, position: { x: number; y: number }) => void;
}) {
  if (!data) return null;
  return (
    <IconButton
      label={`${data.location} actions`}
      aria-haspopup="menu"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        onMenu(data, { x: rect.left, y: rect.bottom });
      }}
    >
      <Ellipsis />
    </IconButton>
  );
}

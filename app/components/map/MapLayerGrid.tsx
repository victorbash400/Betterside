import { useMemo } from "react";
import type { ColDef } from "ag-grid-community";
import DataGrid from "../grid/DataGrid";

export interface MapLayerRow {
  id: string;
  label: string;
  count?: number;
}
export default function MapLayerGrid({
  rows,
  selected,
  onToggle,
}: {
  rows: MapLayerRow[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const hasCounts = rows.some((row) => row.count !== undefined);
  const columns = useMemo<ColDef<MapLayerRow>[]>(
    () => [
      {
        field: "label",
        headerName: "Cause",
        flex: 1,
        minWidth: 130,
        tooltipField: "label",
      },
      ...(hasCounts
        ? [
            {
              field: "count" as const,
              headerName: "Records",
              width: 96,
              minWidth: 96,
              type: "numericColumn",
              filter: "agNumberColumnFilter",
            },
          ]
        : []),
    ],
    [hasCounts],
  );
  return (
    <DataGrid
      label="Map cause layers"
      rows={rows}
      columns={columns}
      selectedIds={selected}
      rowHeight={32}
      onOpen={(row) => onToggle(row.id)}
    />
  );
}

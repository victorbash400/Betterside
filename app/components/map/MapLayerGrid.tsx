import { useMemo } from "react";
import type { ColDef } from "ag-grid-community";
import MapLayerSelectionCell from "./MapLayerSelectionCell";
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
        colId: "selection",
        headerName: "",
        width: 32,
        minWidth: 32,
        maxWidth: 32,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        cellStyle: { padding: "0", justifyContent: "center" },
        valueGetter: ({ data }) => Boolean(data && selected.includes(data.id)),
        cellRenderer: MapLayerSelectionCell,
        cellRendererParams: { onToggle },
      },
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
              width: 80,
              minWidth: 80,
              type: "numericColumn",
              filter: "agNumberColumnFilter",
            },
          ]
        : []),
    ],
    [hasCounts, selected, onToggle],
  );
  return (
    <DataGrid
      label="Map cause layers"
      emptyMessage="Select a source to view causes."
      rows={rows}
      columns={columns}
      selectedIds={selected}
      rowHeight={32}
      onOpen={(row) => onToggle(row.id)}
    />
  );
}

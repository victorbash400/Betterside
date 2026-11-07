import { useMemo } from "react";
import type { ColDef } from "ag-grid-community";
import DataGrid from "../grid/DataGrid";

interface MapLayerRow<Id extends string> {
  id: Id;
  label: string;
  count?: number;
}
export default function MapLayerGrid<Id extends string>({
  rows,
  selected,
  onChange,
}: {
  rows: MapLayerRow<Id>[];
  selected: Id[];
  onChange: (ids: Id[]) => void;
}) {
  const hasCounts = rows.some((row) => row.count !== undefined);
  const columns = useMemo<ColDef<MapLayerRow<Id>>[]>(
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
              width: 80,
              minWidth: 80,
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
      emptyMessage="Select a source to view causes."
      rows={rows}
      columns={columns}
      selectedIds={selected}
      rowHeight={32}
      onSelectionChange={(rows) => onChange(rows.map((row) => row.id))}
    />
  );
}

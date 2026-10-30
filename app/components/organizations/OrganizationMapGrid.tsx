import { useMemo } from "react";
import type { ColDef } from "ag-grid-community";
import type { DirectoryOrganization } from "../../lib/organizations";
import DataGrid from "../grid/DataGrid";
import OrganizationMapInfoCell from "./OrganizationMapInfoCell";
export default function OrganizationMapGrid({
  organizations,
  selected,
  onSelect,
  onDetails,
}: {
  organizations: DirectoryOrganization[];
  selected?: string;
  onSelect: (id: string) => void;
  onDetails: (id: string) => void;
}) {
  const columns = useMemo<ColDef<DirectoryOrganization>[]>(
    () => [
      {
        field: "name",
        headerName: "Organization",
        flex: 1,
        minWidth: 150,
        tooltipValueGetter: ({ data }) =>
          data ? `${data.name}\n${data.topics.join(", ")}` : "",
      },
      {
        colId: "countries",
        headerName: "Countries",
        width: 86,
        minWidth: 86,
        type: "numericColumn",
        filter: "agNumberColumnFilter",
        valueGetter: ({ data }) =>
          data
            ? new Set(data.presence.map((area) => area.countryCode)).size
            : 0,
      },
      {
        colId: "details",
        headerName: "",
        width: 42,
        minWidth: 42,
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: OrganizationMapInfoCell,
        cellRendererParams: { onDetails },
      },
    ],
    [onDetails],
  );
  return (
    <DataGrid
      label="Map organization directory"
      rows={organizations}
      columns={columns}
      selected={selected}
      rowHeight={34}
      onOpen={(row) => onSelect(row.id)}
    />
  );
}

import { useMemo, useRef } from "react";
import type { ColDef } from "ag-grid-community";
import type { DirectoryOrganization } from "../../lib/organizations";
import DataGrid from "../grid/DataGrid";
import OrganizationMapInfoCell from "./OrganizationMapInfoCell";
export default function OrganizationMapGrid({
  organizations,
  loading = false,
  selected,
  onSelect,
  onDetails,
}: {
  organizations: DirectoryOrganization[];
  loading?: boolean;
  selected?: string;
  onSelect: (id: string) => void;
  onDetails: (id: string) => void;
}) {
  const details = useRef(onDetails);
  details.current = onDetails;
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
        width: 96,
        minWidth: 96,
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
        cellStyle: { padding: "0 4px" },
        cellRenderer: OrganizationMapInfoCell,
        cellRendererParams: { onDetails: (id: string) => details.current(id) },
      },
    ],
    [],
  );
  return (
    <DataGrid
      label="Map organization directory"
      emptyMessage="Adjust search or filters to view organizations."
      loading={loading}
      rows={organizations}
      columns={columns}
      selected={selected}
      rowHeight={34}
      onOpen={(row) => onSelect(row.id)}
    />
  );
}

import type { ColDef } from "ag-grid-community";
import type { DirectoryOrganization } from "../../lib/organizations";
import OrganizationDonateCell from "./OrganizationDonateCell";

export const organizationColumns: ColDef<DirectoryOrganization>[] = [
  {
    field: "name",
    headerName: "Organization",
    flex: 1.6,
    minWidth: 220,
    tooltipField: "name",
    sort: "asc",
  },
  {
    field: "topics",
    headerName: "Focus",
    flex: 1.2,
    minWidth: 160,
    valueFormatter: ({ value }) => value?.join(", ") || "—",
    tooltipValueGetter: ({ value }) => value?.join(", "),
    filterValueGetter: ({ data }) => data?.topics.join(", ") ?? "",
  },
  {
    colId: "countries",
    headerName: "Countries",
    flex: 1.1,
    minWidth: 160,
    valueGetter: ({ data }) =>
      data
        ? [...new Set(data.presence.map((area) => area.country))]
            .sort()
            .join(", ")
        : "",
    tooltipValueGetter: ({ value }) => value,
  },
  {
    field: "type",
    headerName: "Type",
    width: 140,
    tooltipField: "type",
    valueFormatter: ({ value }) => value || "—",
  },
  {
    colId: "sources",
    headerName: "Sources",
    width: 140,
    valueGetter: ({ data }) =>
      data
        ? [...new Set(data.sources.map((source) => source.label))].join(", ")
        : "",
  },
  {
    colId: "donate",
    headerName: "Donate",
    width: 90,
    minWidth: 90,
    sortable: false,
    filter: false,
    resizable: false,
    cellRenderer: OrganizationDonateCell,
  },
];

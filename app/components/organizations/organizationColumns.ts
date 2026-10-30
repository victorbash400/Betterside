import type { ColDef } from "ag-grid-community";
import type { DirectoryOrganization } from "../../lib/organizations";
import OrganizationNameCell from "./OrganizationNameCell";
import OrganizationDonateCell from "./OrganizationDonateCell";

export const organizationColumns: ColDef<DirectoryOrganization>[] = [
  {
    field: "name",
    headerName: "Organization",
    flex: 2,
    minWidth: 280,
    cellRenderer: OrganizationNameCell,
    tooltipField: "name",
    sort: "asc",
  },
  {
    field: "topics",
    headerName: "Focus",
    width: 210,
    valueFormatter: ({ value }) => value?.join(", ") || "—",
    filterValueGetter: ({ data }) => data?.topics.join(", ") ?? "",
  },
  {
    colId: "countries",
    headerName: "Operating countries",
    width: 220,
    valueGetter: ({ data }) =>
      data
        ? [...new Set(data.presence.map((area) => area.country))]
            .sort()
            .join(", ")
        : "",
    tooltipValueGetter: ({ value }) => value,
  },
  {
    colId: "countryCount",
    headerName: "Countries",
    width: 120,
    type: "numericColumn",
    filter: "agNumberColumnFilter",
    valueGetter: ({ data }) =>
      data?.presence.length
        ? new Set(data.presence.map((area) => area.countryCode)).size
        : null,
    valueFormatter: ({ value }) => value ?? "—",
  },
  { field: "type", headerName: "Type", width: 185 },
  {
    colId: "sources",
    headerName: "Sources",
    width: 200,
    valueGetter: ({ data }) =>
      data
        ? [...new Set(data.sources.map((source) => source.label))].join(", ")
        : "",
  },
  {
    colId: "donate",
    headerName: "Donate",
    width: 110,
    minWidth: 110,
    pinned: "right",
    sortable: false,
    filter: false,
    resizable: false,
    cellRenderer: OrganizationDonateCell,
  },
];

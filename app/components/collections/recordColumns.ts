import type { ColDef } from "ag-grid-community";
import type { MapItem } from "../../lib/types";
import { formatDate } from "../../lib/dates";
import { concerns, matchesConcern } from "../../lib/concerns";
import {
  recordPrecision,
  recordUnit,
  recordValue,
} from "../../lib/recordValues";
import RecordNameCell from "./RecordNameCell";
import RecordActionsCell from "./RecordActionsCell";

export function recordColumns(
  onMenu: (item: MapItem, position: { x: number; y: number }) => void,
): ColDef<MapItem>[] {
  return [
    {
      field: "location",
      headerName: "Name",
      flex: 2,
      minWidth: 240,
      cellRenderer: RecordNameCell,
      tooltipField: "location",
      sort: "asc",
    },
    {
      colId: "cause",
      headerName: "Cause",
      width: 140,
      valueGetter: ({ data }) =>
        data
          ? concerns
              .filter((cause) => matchesConcern(data, cause.id))
              .map((cause) => cause.label)
              .join(", ") || data.kind
          : "",
    },
    {
      colId: "value",
      headerName: "Value",
      width: 110,
      minWidth: 100,
      type: "numericColumn",
      filter: "agNumberColumnFilter",
      valueGetter: ({ data }) => (data ? recordValue(data) : null),
      valueFormatter: ({ value }) =>
        value === null || value === undefined
          ? "—"
          : new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(
              value,
            ),
    },
    {
      colId: "unit",
      headerName: "Measure",
      width: 190,
      valueGetter: ({ data }) => (data ? recordUnit(data) : ""),
    },
    {
      colId: "referenceEnd",
      headerName: "Reference date",
      width: 135,
      valueGetter: ({ data }) =>
        data?.referencePeriod?.end ?? data?.referencePeriod?.start ?? null,
      valueFormatter: ({ value }) => (value ? formatDate(value, "UTC") : "—"),
    },
    { field: "country", headerName: "Country", width: 150 },
    {
      colId: "precision",
      headerName: "Geography",
      width: 170,
      valueGetter: ({ data }) => (data ? recordPrecision(data) : ""),
    },
    {
      field: "source.published",
      headerName: "Source updated",
      width: 150,
      valueFormatter: ({ value }) => (value ? formatDate(value, "UTC") : "—"),
    },
    { field: "source.label", headerName: "Source", width: 200 },
    {
      colId: "actions",
      headerName: "",
      width: 48,
      minWidth: 48,
      maxWidth: 48,
      pinned: "right",
      sortable: false,
      filter: false,
      resizable: false,
      suppressMovable: true,
      cellRenderer: RecordActionsCell,
      cellRendererParams: { onMenu },
    },
  ];
}

import type { ColDef } from "ag-grid-community";
import type { Contribution } from "../../lib/types";
import { formatDate } from "../../lib/dates";
import ContributionNameCell from "./ContributionNameCell";

const statusLabels = {
  CREATED: "Awaiting payment",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const contributionColumns: ColDef<Contribution>[] = [
  {
    field: "projectName",
    headerName: "Project",
    flex: 1,
    minWidth: 240,
    cellRenderer: ContributionNameCell,
  },
  {
    field: "createdAt",
    headerName: "Date",
    width: 150,
    sort: "desc",
    valueFormatter: ({ value }) => formatDate(value),
  },
  {
    field: "status",
    headerName: "Status",
    width: 165,
    valueFormatter: ({ data }) => (data ? statusLabels[data.status] : ""),
    filterValueGetter: ({ data }) => (data ? statusLabels[data.status] : ""),
  },
  {
    colId: "amount",
    headerName: "Amount",
    width: 150,
    type: "numericColumn",
    filter: "agNumberColumnFilter",
    valueGetter: ({ data }) => (data ? Number(data.amount) : null),
    valueFormatter: ({ value, data }) =>
      data && Number.isFinite(value)
        ? new Intl.NumberFormat("en", {
            style: "currency",
            currency: data.currency,
          }).format(value)
        : "—",
  },
];

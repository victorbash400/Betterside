import SettingsInlineButton from "../settings/SettingsInlineButton";
import { useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, type ColDef } from "ag-grid-community";
import {
  CellSelectionModule,
  RowGroupingModule,
  RowGroupingPanelModule,
  SideBarModule,
  PivotModule,
  ColumnsToolPanelModule,
  ExcelExportModule,
  IntegratedChartsModule,
  SparklinesModule,
  ContextMenuModule,
  MasterDetailModule,
  LicenseManager,
} from "ag-grid-enterprise";
import { AgChartsEnterpriseModule } from "ag-charts-enterprise";
import TrendExportButton from "./TrendExportButton";
import type { TrendSeries } from "../../lib/trends";
import { compactGridTheme, gridTheme } from "../grid/gridTheme";
import styles from "./TrendAnalyticsGrid.module.css";
const license = process.env.NEXT_PUBLIC_AG_GRID_LICENSE_KEY;
if (license) LicenseManager.setLicenseKey(license);
const modules = [
  AllCommunityModule,
  CellSelectionModule,
  RowGroupingModule,
  RowGroupingPanelModule,
  SideBarModule,
  PivotModule,
  ColumnsToolPanelModule,
  ExcelExportModule,
  ContextMenuModule,
  MasterDetailModule,
  IntegratedChartsModule.with(AgChartsEnterpriseModule),
  SparklinesModule.with(AgChartsEnterpriseModule),
];
interface TrendRow {
  id: string;
  country: string;
  name: string;
  source: string;
  first: number;
  latest: number;
  change: number;
  observations: number;
  from: string;
  to: string;
  points: TrendSeries["points"];
  history: { date: Date; value: number }[];
}
export default function TrendAnalyticsGrid({
  series,
  compact = false,
}: {
  series: TrendSeries[];
  compact?: boolean;
}) {
  const grid = useRef<AgGridReact<TrendRow>>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const fitRows = compact && !columnsOpen && series.length <= 4;
  const rows = useMemo<TrendRow[]>(
    () =>
      series
        .filter((item) => item.points.length > 1)
        .map((item) => ({
          id: item.id,
          country: item.country,
          name: item.label,
          source: item.source,
          first: item.points[0].value,
          latest: item.points.at(-1)!.value,
          change: item.points.at(-1)!.value - item.points[0].value,
          observations: item.points.length,
          from: item.points[0].date,
          to: item.points.at(-1)!.date,
          points: item.points,
          history: item.points.map((point) => ({
            date: new Date(point.date),
            value: point.value,
          })),
        })),
    [series],
  );
  const columns = useMemo<ColDef<TrendRow>[]>(
    () => [
      {
        field: "country",
        headerName: "Country",
        enableRowGroup: true,
        enablePivot: true,
        minWidth: 130,
      },
      {
        field: "name",
        headerName: "Series",
        minWidth: 210,
        flex: 1,
        cellRenderer: "agGroupCellRenderer",
      },
      {
        field: "source",
        headerName: "Source",
        enableRowGroup: true,
        enablePivot: true,
        minWidth: 190,
      },
      {
        field: "history",
        headerName: "Trend",
        minWidth: 150,
        sortable: false,
        filter: false,
        chartDataType: "excluded",
        cellRenderer: "agSparklineCellRenderer",
        cellRendererParams: {
          sparklineOptions: {
            type: "line",
            xKey: "date",
            yKey: "value",
            axis: { type: "time" },
            stroke: "#557c76",
            strokeWidth: 1.5,
            marker: { enabled: false },
          },
        },
      },
      {
        field: "from",
        headerName: "First date",
        minWidth: 125,
        valueFormatter: ({ value }) =>
          value
            ? new Date(value).toLocaleDateString("en-GB", { timeZone: "UTC" })
            : "",
      },
      {
        field: "to",
        headerName: "Latest date",
        minWidth: 125,
        valueFormatter: ({ value }) =>
          value
            ? new Date(value).toLocaleDateString("en-GB", { timeZone: "UTC" })
            : "",
      },
      ...(
        [
          ["first", "First"],
          ["latest", "Latest"],
          ["change", "Change"],
          ["observations", "Observations"],
        ] as const
      ).map(([field, headerName]) => ({
        field,
        headerName,
        minWidth: 115,
        enableValue: true,
        allowedAggFuncs: ["min", "max", "avg", "count"],
        type: "numericColumn",
        filter: "agNumberColumnFilter",
        valueFormatter: ({ value }: { value: number }) =>
          value?.toLocaleString("en", { maximumFractionDigits: 2 }) ?? "",
      })),
    ],
    [],
  );
  return (
    <div className={styles.surface} data-compact={compact}>
      <div className={styles.actions}>
        <span>{series[0]?.unit}</span>
        <TrendExportButton grid={grid} />
        <SettingsInlineButton
          aria-pressed={columnsOpen}
          onClick={() => {
            setColumnsOpen(!columnsOpen);
            grid.current?.api.setSideBarVisible(!columnsOpen);
          }}
        >
          Columns
        </SettingsInlineButton>
      </div>
      <div className={styles.grid} data-fit-rows={fitRows}>
        <AgGridReact
          ref={grid}
          modules={modules}
          theme={compact ? compactGridTheme : gridTheme}
          rowData={rows}
          columnDefs={columns}
          defaultColDef={{ sortable: true, filter: true, resizable: true }}
          getRowId={({ data }) => data.id}
          masterDetail
          domLayout={fitRows ? "autoHeight" : "normal"}
          detailRowHeight={230}
          detailCellRendererParams={{
            detailGridOptions: {
              columnDefs: [
                {
                  field: "date",
                  headerName: "Reference from",
                  flex: 1,
                  valueFormatter: ({ value }: { value: string }) =>
                    new Date(value).toLocaleDateString("en-GB", {
                      timeZone: "UTC",
                    }),
                },
                {
                  field: "end",
                  headerName: "Reference through",
                  flex: 1,
                  valueFormatter: ({ value }: { value: string | null }) =>
                    value
                      ? new Date(value).toLocaleDateString("en-GB", {
                          timeZone: "UTC",
                        })
                      : "—",
                },
                {
                  field: "value",
                  headerName: series[0]?.unit,
                  flex: 1,
                  valueFormatter: ({ value }: { value: number }) =>
                    value.toLocaleString("en", { maximumFractionDigits: 2 }),
                },
                { field: "source.label", headerName: "Source", flex: 1 },
              ],
              defaultColDef: { sortable: true, filter: true, resizable: true },
            },
            getDetailRowData: (params: {
              data: TrendRow;
              successCallback: (rows: TrendSeries["points"]) => void;
            }) => params.successCallback(params.data.points),
          }}
          cellSelection
          enableCharts
          rowGroupPanelShow={compact ? "onlyWhenGrouping" : "always"}
          sideBar={{ toolPanels: ["columns"], hiddenByDefault: true }}
          suppressAggFuncInHeader
          rowHeight={40}
        />
      </div>
    </div>
  );
}

import { useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, type ColDef, type SideBarDef } from "ag-grid-community";
import { CellSelectionModule, RowGroupingModule, RowGroupingPanelModule, SideBarModule, PivotModule, ColumnsToolPanelModule, ExcelExportModule, IntegratedChartsModule, ContextMenuModule, LicenseManager } from "ag-grid-enterprise";
import { AgChartsEnterpriseModule } from "ag-charts-enterprise";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import { compactGridTheme } from "../grid/gridTheme";
import styles from "./ChatAnalysisGrid.module.css";
const license = process.env.NEXT_PUBLIC_AG_GRID_LICENSE_KEY;
if (license) LicenseManager.setLicenseKey(license);
const modules = [AllCommunityModule, CellSelectionModule, RowGroupingModule, RowGroupingPanelModule,
  SideBarModule, PivotModule, ColumnsToolPanelModule, ExcelExportModule, ContextMenuModule,
  IntegratedChartsModule.with(AgChartsEnterpriseModule)];
const sideBar: SideBarDef = { toolPanels: ["columns"], defaultToolPanel: "columns", hiddenByDefault: true };
const defaultColDef: ColDef = { sortable: true, filter: true, resizable: true, minWidth: 100, enableRowGroup: true, enablePivot: true };
export default function ChatAnalysisGrid<T extends { id: string }>({ rows, columns, label, onOpen }: {
  rows: T[];
  columns: ColDef<T>[];
  label: string;
  onOpen?: (row: T) => void;
}) {
  const grid = useRef<AgGridReact<T>>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [displayedRows, setDisplayedRows] = useState(rows.length);
  const fitRows = !open && displayedRows <= 6;
  function exportExcel() {
    try {
      const data = grid.current?.api.getDataAsExcel();
      if (!(data instanceof Blob)) throw new Error("Export unavailable. Retry.");
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "betterside-analysis.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setError("");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Export failed."); }
  }
  return <div className={styles.surface}>
    <div className={styles.toolbar}>
      <SettingsInlineButton aria-pressed={open} onClick={() => {
        const next = !open;
        setOpen(next);
        grid.current?.api.setSideBarVisible(next);
        if (next) grid.current?.api.openToolPanel("columns");
        else grid.current?.api.closeToolPanel();
      }}>Columns</SettingsInlineButton>
      <SettingsInlineButton onClick={exportExcel}>Export Excel</SettingsInlineButton>
    </div>
    <div className={styles.grid} data-fit-rows={fitRows}>
      <AgGridReact<T> ref={grid} modules={modules} theme={compactGridTheme} rowData={rows} columnDefs={columns}
        defaultColDef={defaultColDef}
        getRowId={({ data }) => data.id} enableCharts cellSelection suppressNoRowsOverlay rowGroupPanelShow="onlyWhenGrouping"
        sideBar={sideBar}
        domLayout={fitRows ? "autoHeight" : "normal"}
        onModelUpdated={({ api }) => setDisplayedRows(api.getDisplayedRowCount())}
        onToolPanelVisibleChanged={({ api }) => setOpen(api.isToolPanelShowing())}
        onGridReady={({ api }) => api.setGridAriaProperty("label", label)}
        onRowClicked={({ data, event }) => {
          if (event?.target instanceof Element && event.target.closest("a, button")) return;
          if (data) onOpen?.(data);
        }}
        rowHeight={34} headerHeight={34} animateRows={false}/>
    </div>
    {error && <span role="alert">{error}</span>}
  </div>;
}

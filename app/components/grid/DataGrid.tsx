"use client";

import { useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  type ColDef,
  type GridOptions,
} from "ag-grid-community";
import RecordPagination from "../collections/RecordPagination";
import { gridTheme } from "./gridTheme";
import styles from "./DataGrid.module.css";

const modules = [AllCommunityModule];
const defaultColDef = {
  sortable: true,
  resizable: true,
  filter: true,
  minWidth: 120,
};
const rowSelection = {
  mode: "singleRow" as const,
  checkboxes: false,
  enableClickSelection: false,
};

export default function DataGrid<T extends { id: string }>({
  label,
  rows,
  columns,
  rowHeight,
  selected,
  onOpen,
  onContextMenu,
}: {
  label: string;
  rows: T[];
  columns: ColDef<T>[];
  rowHeight?: number;
  selected?: string;
  onOpen: (row: T) => void;
  onContextMenu?: (row: T, event: MouseEvent) => void;
}) {
  const grid = useRef<AgGridReact<T>>(null);
  const [pagination, setPagination] = useState({
    page: 0,
    pages: 1,
    count: rows.length,
  });
  const syncPagination: GridOptions<T>["onPaginationChanged"] = ({ api }) => {
    const next = {
      page: api.paginationGetCurrentPage(),
      pages: Math.max(1, api.paginationGetTotalPages()),
      count: api.paginationGetRowCount(),
    };
    setPagination((previous) =>
      previous.page === next.page &&
      previous.pages === next.pages &&
      previous.count === next.count
        ? previous
        : next,
    );
  };
  return (
    <div className={styles.surface}>
      <div className={styles.grid}>
        <AgGridReact<T>
          ref={grid}
          modules={modules}
          theme={gridTheme}
          rowData={rows}
          rowHeight={rowHeight}
          columnDefs={columns}
          defaultColDef={defaultColDef}
          getRowId={({ data }) => data.id}
          getRowClass={({ data }) =>
            data?.id === selected ? styles.selected : undefined
          }
          rowSelection={rowSelection}
          pagination
          paginationPageSize={100}
          scrollbarWidth={8}
          suppressPaginationPanel
          suppressNoRowsOverlay
          animateRows={false}
          tooltipShowDelay={400}
          ensureDomOrder
          onGridReady={({ api }) => api.setGridAriaProperty("label", label)}
          onPaginationChanged={syncPagination}
          onRowClicked={({ data, event }) => {
            if (
              event?.target instanceof Element &&
              event.target.closest("button,a,input")
            )
              return;
            if (data) onOpen(data);
          }}
          onCellKeyDown={({ data, event }) => {
            if (
              event?.target instanceof Element &&
              event.target.closest("button,a,input")
            )
              return;
            if (data && event instanceof KeyboardEvent && event.key === "Enter")
              onOpen(data);
          }}
          onCellContextMenu={({ data, event }) => {
            if (!data || !onContextMenu || !(event instanceof MouseEvent))
              return;
            event.preventDefault();
            event.stopPropagation();
            onContextMenu(data, event);
          }}
        />
      </div>
      <div className={styles.footer}>
        <span>
          {pagination.count.toLocaleString("en")}{" "}
          {pagination.count === 1 ? "record" : "records"}
        </span>
        {pagination.pages > 1 && (
          <RecordPagination
            page={pagination.page}
            pages={pagination.pages}
            onPage={(page) => grid.current?.api.paginationGoToPage(page)}
          />
        )}
      </div>
    </div>
  );
}

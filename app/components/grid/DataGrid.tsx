"use client";

import { useEffect, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  type ColDef,
  type GridApi,
} from "ag-grid-community";
import LoadingRegion from "../controls/LoadingRegion";
import EmptyState from "../controls/EmptyState";
import RecordPagination from "../collections/RecordPagination";
import { compactGridTheme, gridTheme } from "./gridTheme";
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

const multipleSelection = {
  mode: "multiRow" as const,
  checkboxes: false,
  headerCheckbox: false,
  enableClickSelection: false,
};
function syncSelection<T>(api: GridApi<T> | undefined, ids: Set<string>) {
  api?.forEachNode((node) =>
    node.setSelected(Boolean(node.id && ids.has(node.id))),
  );
}

export default function DataGrid<T extends { id: string }>({
  label,
  rows,
  columns,
  rowHeight,
  compact = false,
  loading = false,
  emptyMessage = "Adjust filters to view records.",
  selected,
  selectedIds,
  onOpen,
  onContextMenu,
}: {
  label: string;
  rows: T[];
  columns: ColDef<T>[];
  rowHeight?: number;
  compact?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  selected?: string;
  selectedIds?: string[];
  onOpen: (row: T) => void;
  onContextMenu?: (row: T, event: MouseEvent) => void;
}) {
  const [ready, setReady] = useState(false);
  const grid = useRef<AgGridReact<T>>(null);
  useEffect(() => {
    syncSelection(
      grid.current?.api,
      new Set(selectedIds ?? (selected ? [selected] : [])),
    );
  }, [selected, selectedIds]);
  const [pagination, setPagination] = useState({
    page: 0,
    pages: 1,
    count: rows.length,
  });
  const fitRows = compact && pagination.count > 0 && pagination.count <= 6;
  const syncPagination = ({ api }: { api: GridApi<T> }) => {
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
    <div className={styles.surface} data-compact={compact} aria-busy={loading || !ready}>
      <div className={styles.grid} data-fit-rows={fitRows} data-empty={pagination.count === 0}>
        <AgGridReact<T>
          ref={grid}
          modules={modules}
          theme={compact ? compactGridTheme : gridTheme}
          domLayout={fitRows ? "autoHeight" : "normal"}
          rowData={rows}
          loading={false}
          rowHeight={rowHeight}
          columnDefs={columns}
          defaultColDef={defaultColDef}
          getRowId={({ data }) => data.id}
          rowSelection={selectedIds ? multipleSelection : rowSelection}
          pagination
          paginationPageSize={100}
          scrollbarWidth={8}
          suppressPaginationPanel
          suppressNoRowsOverlay
          animateRows={false}
          tooltipShowDelay={400}
          ensureDomOrder
          onGridReady={({ api }) => {
            setReady(true);
            api.setGridAriaProperty("label", label);
            syncSelection(
              api,
              new Set(selectedIds ?? (selected ? [selected] : [])),
            );
          }}
          onRowDataUpdated={({ api }) =>
            syncSelection(
              api,
              new Set(selectedIds ?? (selected ? [selected] : [])),
            )
          }
          onPaginationChanged={syncPagination}
          onFilterChanged={syncPagination}
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
            if (
              data &&
              event instanceof KeyboardEvent &&
              (event.key === "Enter" || event.key === " ")
            ) {
              event.preventDefault();
              onOpen(data);
            }
          }}
          onCellContextMenu={({ data, event }) => {
            if (!data || !onContextMenu || !(event instanceof MouseEvent))
              return;
            event.preventDefault();
            event.stopPropagation();
            onContextMenu(data, event);
          }}
        />
        {!loading && ready && pagination.count === 0 && (
          <EmptyState overlay>{emptyMessage}</EmptyState>
        )}
      </div>
      {(loading || !ready) && (
        <div className={styles.loading}>
          <LoadingRegion
            overlay
            compact
            label={`Loading ${label.toLowerCase()}`}
          />
        </div>
      )}
      <div className={styles.footer}>
        <span hidden={loading}>
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

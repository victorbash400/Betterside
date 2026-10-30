import type { ColDef } from "ag-grid-community";
import DataGrid from "../grid/DataGrid";
import { contributionColumns } from "../payments/contributionColumns";
import type { Contribution } from "../../lib/types";
import { useState } from "react";
import styles from "./ChatResult.module.css";
const columns: ColDef<Contribution>[] = [
  ...contributionColumns.map((column) =>
    column.field === "projectName"
      ? { ...column, minWidth: 180, cellRenderer: undefined }
      : column,
  ),
  { field: "id", headerName: "Order", width: 190 },
];
export default function ChatContributionGrid({
  records,
  total,
  nextOffset,
  busy,
  onMore,
}: {
  records: Contribution[];
  total: number;
  nextOffset: number | null;
  busy: boolean;
  onMore: () => void;
}) {
  const [selected, setSelected] = useState<string>();
  return (
    <div className={`${styles.result} ${styles.tableResult}`}>
      <div className={styles.heading}>
        <span>{total.toLocaleString("en")} sandbox orders</span>
        {nextOffset !== null && (
          <button disabled={busy} onClick={onMore}>
            More results
          </button>
        )}
      </div>
      <div
        className={styles.grid}
        style={{ height: Math.min(300, 82 + Math.max(1, records.length) * 34) }}
      >
        <DataGrid
          label="Chat contribution records"
          rows={records}
          columns={columns}
          selected={selected}
          rowHeight={34}
          onOpen={(record) => setSelected(record.id)}
        />
      </div>
    </div>
  );
}

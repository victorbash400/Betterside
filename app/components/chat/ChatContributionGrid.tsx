import type { ColDef } from "ag-grid-community";
import ChatAnalysisGrid from "./ChatAnalysisGrid";
import ChatContributionReceipt from "./ChatContributionReceipt";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import { contributionColumns } from "../payments/contributionColumns";
import type { Contribution } from "../../lib/types";
import { useState } from "react";
import styles from "./ChatResult.module.css";
const columns: ColDef<Contribution>[] = [
  ...contributionColumns.map((column) =>
    column.field === "projectName"
      ? { ...column, minWidth: 180, cellRenderer: undefined, chartDataType: "category" as const }
      : column.colId === "amount" ? { ...column, enableValue: true, chartDataType: "series" as const } : column,
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
    <div className={styles.analysis}>
      <div className={styles.heading}>
        <span>{total.toLocaleString("en")} sandbox orders</span>
        {nextOffset !== null && (
          <SettingsInlineButton disabled={busy} onClick={onMore}>
            More results
          </SettingsInlineButton>
        )}
      </div>
      <div
        className={styles.grid}

      >
        <ChatAnalysisGrid
          label="Chat contribution records"
          rows={records}
          columns={columns}
          onOpen={(record) => setSelected(record.id)}
        />
      </div>
      {records.find((record) => record.id === selected) && <ChatContributionReceipt record={records.find((record) => record.id === selected)!}/>}
    </div>
  );
}

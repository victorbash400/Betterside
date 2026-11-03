import SettingsInlineButton from "../settings/SettingsInlineButton";
import { useState, type RefObject } from "react";
import type { AgGridReact } from "ag-grid-react";
import styles from "./TrendExportButton.module.css";
export default function TrendExportButton<T>({
  grid,
}: {
  grid: RefObject<AgGridReact<T> | null>;
}) {
  const [error, setError] = useState("");
  function download() {
    try {
      const data = grid.current?.api.getDataAsExcel({
        columnKeys: [
          "country",
          "name",
          "source",
          "from",
          "to",
          "first",
          "latest",
          "change",
          "observations",
        ],
      });
      if (!(data instanceof Blob))
        throw new Error("Export unavailable. Retry.");
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "betterside-trends.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setError("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Export failed. Retry.",
      );
    }
  }
  return (
    <div className={styles.export}>
      <SettingsInlineButton onClick={download}>Export Excel</SettingsInlineButton>
      {error && <span role="alert">{error}</span>}
    </div>
  );
}

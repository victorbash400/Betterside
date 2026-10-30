import {
  dataSources,
  type DatasetSelection,
  type FeedStatus,
} from "../../lib/dataSources";
import { useState } from "react";
import { Database, RefreshCw } from "lucide-react";
import DataSourceRow from "./DataSourceRow";
import ToolbarPopover from "./ToolbarPopover";
import styles from "./DataSourcesControl.module.css";
import toolbar from "./WorkspaceToolbar.module.css";
export default function DataSourcesControl({
  value,
  statuses,
  onChange,
  error,
  busy,
  onRefresh,
  label,
}: {
  value: DatasetSelection;
  statuses: FeedStatus[];
  onChange: (value: DatasetSelection) => void;
  error: string;
  busy: boolean;
  onRefresh: () => void;
  label?: string;
}) {
  const [open, setOpen] = useState<{ x: number; y: number } | null>(null);
  const unavailable = statuses.filter(
    (source) => source.state === "error" || source.state === "unconfigured",
  ).length;
  const partial = statuses.filter(
    (source) => source.state === "partial",
  ).length;
  const problem = [
    ...(unavailable ? [`${unavailable} unavailable`] : []),
    ...(partial ? [`${partial} partial`] : []),
  ].join(", ");
  return (
    <>
      <button
        className={toolbar.control}
        aria-label={
          error
            ? `${label ?? "Data sources"}: ${error}`
            : (label ?? "Data sources")
        }
        title={error || label || "Data sources"}
        aria-haspopup="dialog"
        aria-expanded={Boolean(open)}
        onClick={(event) => {
          const r = event.currentTarget.getBoundingClientRect();
          setOpen(open ? null : { x: r.left, y: r.bottom + 6 });
        }}
      >
        <Database size={15} />
        {label && <span>{label}</span>}
        {(problem || error) && (
          <span className={styles.warning}>{problem || "Data error"}</span>
        )}
      </button>
      {open && (
        <ToolbarPopover
          {...open}
          label={label ?? "Data sources"}
          onClose={() => setOpen(null)}
        >
          <div className={styles.actions}>
            <button
              onClick={onRefresh}
              disabled={busy}
              title="Reuses fresh data; refreshes expired sources."
            >
              <RefreshCw size={14} />
              {busy ? "Refreshing" : "Refresh sources"}
            </button>
          </div>
          {error && !problem && (
            <p className={styles.warning} role="alert">
              {error}
            </p>
          )}
          {dataSources.map(({ id, label }) => (
            <DataSourceRow
              key={id}
              label={label}
              enabled={value[id] !== false}
              status={statuses.find((source) => source.id === id)}
              onChange={(enabled) => onChange({ ...value, [id]: enabled })}
            />
          ))}
        </ToolbarPopover>
      )}
    </>
  );
}

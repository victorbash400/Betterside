import LoadingSpinner from "../controls/LoadingSpinner";
import {
  dataSources,
  type DatasetSelection,
  type FeedStatus,
} from "../../lib/dataSources";
import { RefreshCw } from "lucide-react";
import DataSourceRow from "./DataSourceRow";
import styles from "./DataSourceFields.module.css";
export default function DataSourceFields({
  value,
  statuses,
  onChange,
  error,
  busy,
  onRefresh,
}: {
  value: DatasetSelection;
  statuses: FeedStatus[];
  onChange: (value: DatasetSelection) => void;
  error: string;
  busy: boolean;
  onRefresh: () => void;
}) {
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
    <div className={styles.fields}>
      <div className={styles.actions}>
        <button
          onClick={onRefresh}
          disabled={busy}
          title="Reuses fresh data; refreshes expired sources."
        >
          {busy ? (
            <LoadingSpinner size={24} label="Refreshing sources" />
          ) : (
            <RefreshCw size={14} />
          )}
          Refresh sources
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
    </div>
  );
}

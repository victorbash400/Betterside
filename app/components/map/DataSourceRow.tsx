import { ChevronDown } from "lucide-react";
import ToggleSwitch from "../controls/ToggleSwitch";
import type { FeedStatus } from "../../lib/dataSources";
import styles from "./DataSourceRow.module.css";
const stateLabels = {
  ready: "Available",
  partial: "Partial download",
  error: "Unavailable",
  unconfigured: "Setup required",
} as const;
export default function DataSourceRow({
  label,
  enabled,
  status,
  onChange,
}: {
  label: string;
  enabled: boolean;
  status?: FeedStatus;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className={styles.source}>
      <div className={styles.heading}>
        <span>{label}</span>
        <ToggleSwitch
          label={`Enable ${label}`}
          checked={enabled}
          onChange={onChange}
        />
      </div>
      {status && (
        <div className={styles.facts}>
          <span>{status.count.toLocaleString("en")} records</span>
          <span
            className={status.state === "ready" ? undefined : styles.problem}
          >
            {stateLabels[status.state]}
          </span>
        </div>
      )}
      {status && (
        <details className={styles.details}>
          <summary aria-label={`${label} details`}>
            {status.excludedRecords
              ? `${status.excludedRecords.toLocaleString("en")} excluded`
              : "Details"}{" "}
            <ChevronDown size={12} />
          </summary>
          {status.message && <p>{status.message}</p>}
          <dl className={styles.times}>
            <dt>
              {status.state === "unconfigured"
                ? "Checked"
                : status.state === "error"
                  ? "Attempted"
                  : "Fetched"}
            </dt>
            <dd>
              {new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(status.fetchedAt))}
            </dd>
            {(status.expiresAt || status.retryAt) && (
              <>
                <dt>{status.retryAt ? "Retry after" : "Refresh after"}</dt>
                <dd>
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date((status.retryAt ?? status.expiresAt)!))}
                </dd>
              </>
            )}
          </dl>
        </details>
      )}
    </div>
  );
}

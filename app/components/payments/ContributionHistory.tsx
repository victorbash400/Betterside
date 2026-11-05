"use client";
import LoadingSpinner from "../controls/LoadingSpinner";
import EmptyState from "../controls/EmptyState";
import { useState } from "react";
import { RefreshCw, Download, ChevronDown } from "lucide-react";
import IconButton from "../controls/IconButton";
import ContextMenu from "../controls/ContextMenu";
import DataGrid from "../grid/DataGrid";
import { contributionColumns } from "./contributionColumns";
import ContributionDetails from "./ContributionDetails";
import { useContributions } from "../../state/useContributions";
import type { Contribution } from "../../lib/types";
import styles from "./ContributionHistory.module.css";
export default function ContributionHistory({
  compact = false,
  onExplore,
  onProject,
}: {
  compact?: boolean;
  onExplore: () => void;
  onProject: (projectId: string) => void;
}) {
  const { records, busy, error, refresh } = useContributions();
  const [status, setStatus] = useState("All payments"),
    [menu, setMenu] = useState<{ x: number; y: number } | null>(null),
    [selected, setSelected] = useState<Contribution>();
  const visible = records.filter(
    (record) => status === "All payments" || record.status === status,
  );
  function exportRecords() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(visible, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "betterside-contributions.json";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section
      className={styles.history}
      aria-label="Contribution history"
      style={
        compact
          ? {
              height: `min(${Math.min(420, 111 + (visible.length || 3) * 48)}px, calc(100dvh - 140px))`,
              flex: "none",
            }
          : undefined
      }
    >
      <div className={styles.toolbar}>
        <button
          className={styles.filter}
          aria-haspopup="menu"
          aria-expanded={Boolean(menu)}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setMenu({ x: rect.left, y: rect.bottom + 6 });
          }}
        >
          {status === "All payments" ? status : status.toLowerCase()}
          <ChevronDown size={13} />
        </button>
        <div className={styles.actions}>
          <IconButton
            label="Refresh contributions"
            disabled={busy}
            onClick={refresh}
          >
            {busy ? (
              <LoadingSpinner size={24} label="Refreshing contributions" />
            ) : (
              <RefreshCw />
            )}
          </IconButton>
          <IconButton
            label="Export contributions"
            disabled={!visible.length}
            onClick={exportRecords}
          >
            <Download />
          </IconButton>
        </div>
      </div>
      <div className={styles.content}>
        {error ? (
          <div className={styles.notice} role="alert">
            {error}
            <button onClick={refresh}>Retry</button>
          </div>
        ) : !busy && !visible.length ? (
          <EmptyState>
            <span>
              {records.length
                ? "Choose another payment status."
                : "Explore projects to contribute."}
            </span>
            <button
              onClick={records.length ? () => setStatus("All payments") : onExplore}
            >
              {records.length ? "All payments" : "Explore projects"}
            </button>
          </EmptyState>
        ) : (
          <DataGrid
            label="Contribution history"
            loading={busy}
            rows={visible}
            columns={contributionColumns}
            onOpen={setSelected}
          />
        )}
      </div>
      {menu && (
        <ContextMenu
          {...menu}
          label="Payment status"
          onClose={() => setMenu(null)}
          entries={[
            "All payments",
            "COMPLETED",
            "CREATED",
            "CANCELLED",
            "FAILED",
            "REFUNDED",
          ].map((value) => ({
            label:
              value === "All payments"
                ? value
                : value.charAt(0) + value.slice(1).toLowerCase(),
            selected: status === value,
            action: () => setStatus(value),
          }))}
        />
      )}
      {selected && (
        <ContributionDetails
          record={selected}
          onClose={() => setSelected(undefined)}
          onProject={() => {
            onProject(selected.projectId);
            setSelected(undefined);
          }}
        />
      )}
    </section>
  );
}

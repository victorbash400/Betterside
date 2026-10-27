"use client";
import { useState } from "react";
import { RefreshCw, Download, ChevronDown, Check } from "lucide-react";
import IconButton from "../controls/IconButton";
import ContextMenu from "../controls/ContextMenu";
import ContributionRow from "./ContributionRow";
import ContributionDetails from "./ContributionDetails";
import { useContributions } from "../../state/useContributions";
import type { Contribution } from "../../lib/types";
import styles from "./ContributionHistory.module.css";
export default function ContributionHistory({
  onExplore,
  onProject,
}: {
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
    <section className={styles.history} aria-label="Contribution history">
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
        <span>
          {records.length}{" "}
          {records.length === 1 ? "contribution" : "contributions"}
        </span>
        <div className={styles.actions}>
          <IconButton
            label="Refresh contributions"
            disabled={busy}
            onClick={refresh}
          >
            <RefreshCw />
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
      <div className={styles.scroll}>
        {busy ? (
          <span className={styles.notice} role="status">
            Loading contributions
          </span>
        ) : error ? (
          <div className={styles.notice} role="alert">
            {error}
            <button onClick={refresh}>Retry</button>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <span>Project</span>
              <span>Date</span>
              <span>Status</span>
              <span>Amount</span>
            </div>
            {visible.map((record) => (
              <ContributionRow
                key={record.id}
                record={record}
                onOpen={() => setSelected(record)}
              />
            ))}
            {!visible.length && (
              <button className={styles.explore} onClick={onExplore}>
                Explore projects
              </button>
            )}
          </>
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
            icon: status === value ? Check : undefined,
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

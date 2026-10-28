import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import SettingsPicker from "../settings/SettingsPicker";
import ToolbarPopover from "./ToolbarPopover";
import {
  defaultDiscoveryFilters,
  type DiscoveryFilters as Filters,
} from "../../lib/discoveryFilters";
import type { OverlaySettings } from "../../lib/concerns";
import styles from "./WorkspaceToolbar.module.css";
export default function DiscoveryFilters({
  value,
  onChange,
  overlay,
  onOverlay,
}: {
  value: Filters;
  onChange: (value: Filters) => void;
  overlay: OverlaySettings;
  onOverlay: (value: OverlaySettings) => void;
}) {
  const [open, setOpen] = useState<{ x: number; y: number } | null>(null);
  const active =
    Number(Boolean(value.recordType)) +
    Number(Boolean(value.precision)) +
    Number(overlay.period !== "Latest");
  return (
    <>
      <button
        className={styles.control}
        title="Filters"
        aria-label="Filters"
        aria-haspopup="dialog"
        aria-expanded={Boolean(open)}
        onClick={(event) => {
          const r = event.currentTarget.getBoundingClientRect();
          setOpen(open ? null : { x: r.left, y: r.bottom + 6 });
        }}
      >
        <SlidersHorizontal size={15} />
        <span className={styles.optional}>Filters</span>
        {active > 0 && <span>{active}</span>}
        <ChevronDown size={12} />
      </button>
      {open && (
        <ToolbarPopover
          {...open}
          label="Discovery filters"
          onClose={() => setOpen(null)}
        >
          <div className={styles.rows}>
            <label>
              Period
              <SettingsPicker
                width={176}
                label="Reporting window"
                value={overlay.period}
                options={(
                  ["Latest", "30 days", "90 days", "1 year"] as const
                ).map((value) => ({
                  value,
                  label: value === "Latest" ? "Latest available" : value,
                }))}
                onChange={(period) =>
                  onOverlay({
                    ...overlay,
                    period: period as OverlaySettings["period"],
                  })
                }
              />
            </label>
            <label>
              Records
              <SettingsPicker
                width={176}
                label="Record type"
                value={value.recordType}
                options={[
                  { value: "", label: "All records" },
                  ...["Observation", "Emergency", "Indicator"].map((value) => ({
                    value,
                    label: value,
                  })),
                ]}
                onChange={(recordType) => onChange({ ...value, recordType })}
              />
            </label>
            <label>
              Geography
              <SettingsPicker
                width={176}
                label="Location precision"
                value={value.precision}
                options={[
                  { value: "", label: "All locations" },
                  ...[
                    "Event location",
                    "Administrative area",
                    "Country centroid",
                  ].map((value) => ({ value, label: value })),
                ]}
                onChange={(precision) => onChange({ ...value, precision })}
              />
            </label>
            {(active > 0 || value.country) && (
              <button
                className={styles.reset}
                onClick={() => {
                  onChange(defaultDiscoveryFilters);
                  onOverlay({ ...overlay, period: "Latest" });
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </ToolbarPopover>
      )}
    </>
  );
}

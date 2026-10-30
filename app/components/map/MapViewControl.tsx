import { useState } from "react";
import { Map, ChevronDown } from "lucide-react";
import SettingsPicker from "../settings/SettingsPicker";
import OverlayAppearanceFields from "./OverlayAppearanceFields";
import ToggleSwitch from "../controls/ToggleSwitch";
import ToolbarPopover from "./ToolbarPopover";
import type { MapViewSettings } from "../../lib/mapViews";
import type { OverlaySettings } from "../../lib/concerns";
import styles from "./WorkspaceToolbar.module.css";
export default function MapViewControl({
  value,
  onChange,
  overlay,
  onOverlay,
}: {
  value: MapViewSettings;
  onChange: (value: MapViewSettings) => void;
  overlay?: OverlaySettings;
  onOverlay?: (value: OverlaySettings) => void;
}) {
  const [open, setOpen] = useState<{ x: number; y: number } | null>(null);
  return (
    <>
      <button
        className={styles.control}
        title="Map view options"
        aria-label="Map view options"
        aria-haspopup="dialog"
        aria-expanded={Boolean(open)}
        onClick={(event) => {
          const r = event.currentTarget.getBoundingClientRect();
          setOpen(open ? null : { x: r.left, y: r.bottom + 6 });
        }}
      >
        <Map size={15} />
        <span className={styles.optional}>View</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <ToolbarPopover
          {...open}
          label="Map view options"
          onClose={() => setOpen(null)}
        >
          <div className={styles.rows}>
            <label>
              Basemap
              <SettingsPicker
                width={160}
                label="Basemap"
                value={value.basemap}
                options={[
                  { value: "Atlas", label: "Atlas" },
                  { value: "Dark", label: "Dark" },
                ]}
                onChange={(basemap) =>
                  onChange({
                    ...value,
                    basemap: basemap as MapViewSettings["basemap"],
                  })
                }
              />
            </label>
            <label>
              Labels
              <ToggleSwitch
                label="Map labels"
                checked={value.labels}
                onChange={(labels) => onChange({ ...value, labels })}
              />
            </label>
            <label>
              Boundaries
              <ToggleSwitch
                label="Map boundaries"
                checked={value.boundaries}
                onChange={(boundaries) => onChange({ ...value, boundaries })}
              />
            </label>
            {overlay && onOverlay && (
              <OverlayAppearanceFields value={overlay} onChange={onOverlay} />
            )}
          </div>
        </ToolbarPopover>
      )}
    </>
  );
}

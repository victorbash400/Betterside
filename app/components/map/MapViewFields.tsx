import SettingsPicker from "../settings/SettingsPicker";
import OverlayAppearanceFields from "./OverlayAppearanceFields";
import ToggleSwitch from "../controls/ToggleSwitch";
import type { MapViewSettings } from "../../lib/mapViews";
import type { OverlaySettings } from "../../lib/concerns";
import styles from "./WorkspaceToolbar.module.css";
export default function MapViewFields({
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
  return (
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
  );
}

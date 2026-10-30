import SettingsPicker from "../settings/SettingsPicker";
import type { OverlaySettings } from "../../lib/concerns";
import styles from "./WorkspaceToolbar.module.css";
export default function OverlayAppearanceFields({
  value,
  onChange,
}: {
  value: OverlaySettings;
  onChange: (value: OverlaySettings) => void;
}) {
  return (
    <div className={styles.rows}>
      <label>
        Period
        <SettingsPicker
          label="Reporting window"
          value={value.period}
          width={160}
          options={[
            { value: "Latest", label: "Latest available" },
            { value: "30 days", label: "30 days" },
            { value: "90 days", label: "90 days" },
            { value: "1 year", label: "1 year" },
          ]}
          onChange={(period) =>
            onChange({ ...value, period: period as OverlaySettings["period"] })
          }
        />
      </label>
      <label>
        Scale
        <SettingsPicker
          label="Value scale"
          value={value.scale}
          width={160}
          options={[
            { value: "Logarithmic", label: "Logarithmic" },
            { value: "Linear", label: "Linear" },
          ]}
          onChange={(scale) =>
            onChange({ ...value, scale: scale as OverlaySettings["scale"] })
          }
        />
      </label>
      <label>
        Opacity
        <input
          className={styles.slider}
          type="range"
          aria-label="Overlay opacity"
          min="0.2"
          max="1"
          step="0.05"
          value={value.opacity}
          onChange={(event) =>
            onChange({ ...value, opacity: Number(event.target.value) })
          }
        />
      </label>
      {value.mode === "Heatmap" ? (
        <label>
          Spread
          <input
            className={styles.slider}
            type="range"
            aria-label="Heatmap spread"
            min="12"
            max="80"
            step="2"
            value={value.radius}
            onChange={(event) =>
              onChange({ ...value, radius: Number(event.target.value) })
            }
          />
        </label>
      ) : value.mode === "Columns" || value.mode === "Spikes" ? (
        <label>
          Height
          <input
            className={styles.slider}
            type="range"
            aria-label="Extrusion height"
            min="250000"
            max="2000000"
            step="50000"
            value={value.height}
            onChange={(event) =>
              onChange({ ...value, height: Number(event.target.value) })
            }
          />
        </label>
      ) : null}
    </div>
  );
}

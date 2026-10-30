import { useMemo } from "react";
import Dialog from "../controls/Dialog";
import LayerSelect from "./LayerSelect";
import ConcernLayerRow from "./ConcernLayerRow";
import { type OverlaySettings } from "../../lib/concerns";
import { overlayPoints } from "../../lib/overlayData";
import type { MapGeography } from "../../lib/mapGeography";
import type { MapItem } from "../../lib/types";
import styles from "./LayerControlsDialog.module.css";
export default function LayerControlsDialog({
  geography,
  value,
  items,
  onChange,
  onClose,
  showAppearance,
}: {
  geography: MapGeography;
  value: OverlaySettings;
  showAppearance: boolean;
  items: MapItem[];
  onChange: (value: OverlaySettings) => void;
  onClose: () => void;
}) {
  const points = useMemo(
    () =>
      overlayPoints(
        items,
        { concerns: value.concerns, scale: value.scale },
        geography,
      ),
    [items, value.concerns, value.scale, geography],
  );
  return (
    <Dialog title="Layer settings" onClose={onClose} modal={false}>
      <div className={styles.content}>
        <div className={styles.layers}>
          <div className={styles.columns}>
            <span>Cause</span>
            <span>Color</span>
          </div>
          {value.concerns.map((id) => (
            <ConcernLayerRow
              key={id}
              id={id}
              value={value}
              points={points}
              onChange={onChange}
            />
          ))}
        </div>
        {showAppearance && (
          <div className={styles.display}>
            <label>
              Scale
              <LayerSelect
                label="Value scale"
                value={value.scale}
                options={[
                  { value: "Logarithmic", label: "Logarithmic" },
                  { value: "Linear", label: "Linear" },
                ]}
                onChange={(scale) =>
                  onChange({
                    ...value,
                    scale: scale as OverlaySettings["scale"],
                  })
                }
              />
            </label>
            <label>
              Opacity
              <input
                className={styles.slider}
                aria-label="Overlay opacity"
                type="range"
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
                  aria-label="Heatmap spread"
                  type="range"
                  min="12"
                  max="80"
                  step="2"
                  value={value.radius}
                  onChange={(event) =>
                    onChange({ ...value, radius: Number(event.target.value) })
                  }
                />
              </label>
            ) : value.mode !== "Areas" ? (
              <label>
                Height
                <input
                  className={styles.slider}
                  aria-label="Extrusion height"
                  type="range"
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
        )}
      </div>
    </Dialog>
  );
}

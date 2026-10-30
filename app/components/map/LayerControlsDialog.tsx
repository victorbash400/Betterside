import { useMemo } from "react";
import Dialog from "../controls/Dialog";
import OverlayAppearanceFields from "./OverlayAppearanceFields";
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
          <OverlayAppearanceFields value={value} onChange={onChange} />
        )}
      </div>
    </Dialog>
  );
}

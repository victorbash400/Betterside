import { Plus, Minus, LocateFixed } from "lucide-react";
import IconButton from "../controls/IconButton";
import ToggleSwitch from "../controls/ToggleSwitch";
import styles from "./MapControls.module.css";
export default function MapControls({
  globe,
  onProjection,
  onZoom,
  onReset,
}: {
  globe: boolean;
  onProjection: () => void;
  onZoom: (direction: number) => void;
  onReset: () => void;
}) {
  return (
    <div className={styles.options} role="group" aria-label="Map controls">
      <div className={styles.actions}>
        <div className={styles.projection}>
          <span>2D</span>
          <ToggleSwitch
            label="3D globe"
            checked={globe}
            onChange={onProjection}
          />
          <span>3D</span>
        </div>
        <div className={styles.group}>
          <IconButton label="Zoom out" onClick={() => onZoom(-1)}>
            <Minus />
          </IconButton>
          <IconButton label="Zoom in" onClick={() => onZoom(1)}>
            <Plus />
          </IconButton>
        </div>
        <div className={styles.group}>
          <IconButton label="Reset map" onClick={onReset}>
            <LocateFixed />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

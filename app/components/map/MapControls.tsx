import { Plus, Minus, LocateFixed } from "lucide-react";
import IconButton from "../controls/IconButton";
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
        <div className={styles.group}>
          <IconButton
            label={globe ? "Switch to flat map" : "Switch to globe"}
            onClick={onProjection}
          >
            <span>{globe ? "2D" : "Globe"}</span>
          </IconButton>
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

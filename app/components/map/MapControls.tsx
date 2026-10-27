import { Plus, Minus, Globe2, Map, LocateFixed } from "lucide-react";
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
    <div className={styles.controls}>
      <IconButton label="Zoom in" onClick={() => onZoom(1)}>
        <Plus />
      </IconButton>
      <IconButton label="Zoom out" onClick={() => onZoom(-1)}>
        <Minus />
      </IconButton>
      <IconButton
        label={globe ? "Switch to flat map" : "Switch to globe"}
        onClick={onProjection}
      >
        {globe ? <Map /> : <Globe2 />}
      </IconButton>
      <IconButton label="Reset map" onClick={onReset}>
        <LocateFixed />
      </IconButton>
    </div>
  );
}

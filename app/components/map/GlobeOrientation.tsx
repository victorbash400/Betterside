import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import IconButton from "../controls/IconButton";
import styles from "./GlobeOrientation.module.css";
export interface OrientationChange {
  longitude?: number;
  latitude?: number;
  bearing?: number;
  pitch?: number;
}
export default function GlobeOrientation({
  onChange,
}: {
  onChange: (change: OrientationChange) => void;
}) {
  return (
    <>
      <div
        className={`${styles.controls} ${styles.north}`}
        role="group"
        aria-label="Globe rotation"
      >
        <IconButton
          label="Rotate west"
          title="Rotate west"
          onClick={() => onChange({ longitude: -25 })}
        >
          <ArrowLeft />
        </IconButton>
        <IconButton
          label="View north"
          title="View north"
          onClick={() => onChange({ latitude: 20 })}
        >
          <ArrowUp />
        </IconButton>
        <IconButton
          label="Rotate east"
          title="Rotate east"
          onClick={() => onChange({ longitude: 25 })}
        >
          <ArrowRight />
        </IconButton>
      </div>
      <div
        className={`${styles.controls} ${styles.south}`}
        role="group"
        aria-label="Globe orientation"
      >
        <IconButton
          label="Turn counterclockwise"
          title="Turn counterclockwise"
          onClick={() => onChange({ bearing: -20 })}
        >
          <RotateCcw />
        </IconButton>
        <IconButton
          label="View south"
          title="View south"
          onClick={() => onChange({ latitude: -20 })}
        >
          <ArrowDown />
        </IconButton>
        <IconButton
          label="Turn clockwise"
          title="Turn clockwise"
          onClick={() => onChange({ bearing: 20 })}
        >
          <RotateCw />
        </IconButton>
      </div>
    </>
  );
}

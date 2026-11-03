import { useState } from "react";
import ContextMenu from "../controls/ContextMenu";
import styles from "./PinFilterMenu.module.css";

export const pinTypes = ["Countries", "Causes", "Problems", "Organizations"] as const;
export type PinType = (typeof pinTypes)[number];

export default function PinFilterMenu({ value, onChange }: {
  value: PinType;
  onChange: (value: PinType) => void;
}) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  return (
    <>
      <button
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={Boolean(position)}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setPosition(position ? null : { x: rect.right - 190, y: rect.bottom + 6 });
        }}
      >
        Filter
      </button>
      {position && (
        <ContextMenu
          {...position}
          label="Filter pins"
          onClose={() => setPosition(null)}
          entries={pinTypes.map((type) => ({
            label: type,
            selected: value === type,
            action: () => onChange(type),
          }))}
        />
      )}
    </>
  );
}

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import ContextMenu from "../controls/ContextMenu";
import styles from "./LayerSelect.module.css";
export default function LayerSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  return (
    <>
      <button
        className={styles.select}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={Boolean(menu)}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setMenu(menu ? null : { x: rect.left, y: rect.bottom + 6 });
        }}
      >
        <span>
          {options.find((item) => item.value === value)?.label ?? label}
        </span>
        <ChevronDown size={13} />
      </button>
      {menu && (
        <ContextMenu
          {...menu}
          label={label}
          onClose={() => setMenu(null)}
          entries={options.map((item) => ({
            label: item.label,
            selected: item.value === value,
            action: () => onChange(item.value),
          }))}
        />
      )}
    </>
  );
}

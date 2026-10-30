import {
  ChevronDown,
  Flame,
  Map,
  ChartNoAxesColumnIncreasing,
  Triangle,
} from "lucide-react";
import { useState } from "react";
import ContextMenu from "../controls/ContextMenu";
import type { OverlaySettings, OverlayMode } from "../../lib/concerns";
import styles from "./WorkspaceToolbar.module.css";
const modes = [
  { name: "Areas", label: "Areas", Icon: Map },
  { name: "Heatmap", label: "Heatmap", Icon: Flame },
  { name: "Columns", label: "Columns", Icon: ChartNoAxesColumnIncreasing },
  { name: "Spikes", label: "Spikes", Icon: Triangle },
] as const;
export default function OverlayModeControl({
  value,
  onChange,
}: {
  value: OverlaySettings;
  onChange: (value: OverlaySettings) => void;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const Icon = modes.find((mode) => mode.name === value.mode)!.Icon;
  return (
    <>
      <button
        className={styles.control}
        title="Visualization"
        aria-label="Visualization"
        aria-haspopup="menu"
        aria-expanded={Boolean(menu)}
        onClick={(event) => {
          const r = event.currentTarget.getBoundingClientRect();
          setMenu(menu ? null : { x: r.left, y: r.bottom + 6 });
        }}
      >
        <Icon size={15} />
        {modes.find((mode) => mode.name === value.mode)!.label}
        <ChevronDown size={12} />
      </button>
      {menu && (
        <ContextMenu
          {...menu}
          label="Visualization"
          onClose={() => setMenu(null)}
          entries={modes.map(({ name, label, Icon }) => ({
            label,
            icon: Icon,
            selected: value.mode === name,
            action: () => onChange({ ...value, mode: name as OverlayMode }),
          }))}
        />
      )}
    </>
  );
}

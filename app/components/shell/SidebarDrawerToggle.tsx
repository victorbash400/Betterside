import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  type LucideIcon,
} from "lucide-react";
import styles from "./SidebarDrawerToggle.module.css";

export default function SidebarDrawerToggle({
  label,
  Icon,
  open,
  side,
  onToggle,
}: {
  label: string;
  Icon: LucideIcon;
  open: boolean;
  side: "left" | "right";
  onToggle: () => void;
}) {
  const ToggleIcon =
    side === "left"
      ? open
        ? PanelLeftClose
        : PanelLeftOpen
      : open
        ? PanelRightClose
        : PanelRightOpen;
  return (
    <button
      className={styles.row}
      aria-label={`${open ? "Close" : "Open"} ${label.toLowerCase()}`}
      aria-expanded={open}
      aria-controls={open ? `map-${label.toLowerCase()}-drawer` : undefined}
      onClick={onToggle}
    >
      <Icon size={24} strokeWidth={1.8} />
      <span>{label}</span>
      <ToggleIcon size={16} />
    </button>
  );
}

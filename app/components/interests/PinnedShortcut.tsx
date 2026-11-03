import { Globe2, Layers, PinOff, Building2 } from "lucide-react";
import IconButton from "../controls/IconButton";
import type { Interest } from "../../lib/tracking";
import styles from "./PinnedShortcut.module.css";

export default function PinnedShortcut({
  pin,
  active,
  onOpen,
  onUnpin,
}: {
  pin: Interest;
  active: boolean;
  onOpen: () => void;
  onUnpin: () => void;
}) {
  const Icon =
    pin.target?.kind === "organization"
      ? Building2
      : pin.target?.kind === "country"
        ? Globe2
        : Layers;
  return (
    <div className={`${styles.row} ${active ? styles.active : ""}`}>
      <button
        className={styles.label}
        onClick={onOpen}
        aria-current={active ? "page" : undefined}
        title={pin.name}
      >
        <Icon size={22} strokeWidth={1.7} />
        <span>{pin.name}</span>
      </button>
      <IconButton label={`Unpin ${pin.name}`} onClick={onUnpin}>
        <PinOff size={14} />
      </IconButton>
    </div>
  );
}

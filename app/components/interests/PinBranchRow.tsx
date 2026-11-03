import { Check, ChevronDown, ChevronRight, Pin } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import IconButton from "../controls/IconButton";
import styles from "./PinBranchRow.module.css";

export default function PinBranchRow({
  label,
  expanded,
  onToggle,
  saved,
  onPin,
  children,
}: {
  label: string;
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
  saved?: boolean;
  onPin?: () => void;
  children: ReactNode;
}) {
  const id = useId();
  const [opened, setOpened] = useState(expanded);
  function toggle(value: boolean) {
    if (value) setOpened(true);
    onToggle(value);
  }
  return (
    <div>
      <div className={styles.row}>
        <button
          className={styles.open}
          aria-label={label}
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => toggle(!expanded)}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault();
              toggle(event.key === "ArrowRight");
            }
          }}
        >
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          <span>{label}</span>
        </button>
        {onPin && (
          <IconButton
            label={`${saved ? "Pinned" : "Pin"} ${label}`}
            disabled={saved}
            onClick={onPin}
          >
            {saved ? <Check size={15} /> : <Pin size={15} />}
          </IconButton>
        )}
      </div>
      <div id={id} hidden={!expanded} className={styles.children}>
        {opened && children}
      </div>
    </div>
  );
}

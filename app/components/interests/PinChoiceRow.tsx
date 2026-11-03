import { Check, Globe2, Layers, FileText, Pin, Building2 } from "lucide-react";
import styles from "./PinChoiceRow.module.css";

export default function PinChoiceRow({
  kind,
  label,
  detail,
  saved,
  onChoose,
}: {
  kind: "country" | "cause" | "record" | "organization";
  label: string;
  detail?: string;
  saved: boolean;
  onChoose: () => void;
}) {
  const Icon =
    kind === "country"
      ? Globe2
      : kind === "cause"
        ? Layers
        : kind === "organization"
          ? Building2
          : FileText;
  return (
    <button
      className={styles.row}
      disabled={saved}
      onClick={onChoose}
      aria-label={`${saved ? "Pinned" : "Pin"} ${label}`}
    >
      <Icon size={18} />
      <span>
        {label}
        {detail && <small>{detail}</small>}
      </span>
      {saved ? <Check size={15} /> : <Pin size={15} />}
    </button>
  );
}

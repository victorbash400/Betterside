import { MapPin } from "lucide-react";
import styles from "./ComposerLocation.module.css";
export default function ComposerLocation({
  name,
  onClick,
}: {
  name: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.location}
      onClick={onClick}
      title={`Location of interest: ${name}`}
      aria-label={`Location of interest: ${name}. Open map.`}
    >
      <MapPin size={14} />
      <span>{name}</span>
    </button>
  );
}

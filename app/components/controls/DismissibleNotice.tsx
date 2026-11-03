import { useState } from "react";
import { X } from "lucide-react";
import IconButton from "./IconButton";
import styles from "./DismissibleNotice.module.css";
export default function DismissibleNotice({ message }: { message: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className={styles.notice} role="status">
      <span>{message}</span>
      <IconButton label="Dismiss notice" onClick={() => setDismissed(true)}>
        <X size={14} />
      </IconButton>
    </div>
  );
}

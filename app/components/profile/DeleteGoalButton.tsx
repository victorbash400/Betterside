import { useState } from "react";
import { Trash2 } from "lucide-react";
import IconButton from "../controls/IconButton";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import styles from "./DeleteGoalButton.module.css";

export default function DeleteGoalButton({
  name,
  pendingApproval,
  busy,
  onDelete,
}: {
  name: string;
  pendingApproval: boolean;
  busy: boolean;
  onDelete: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <IconButton
        label={`Delete ${name}`}
        title="Delete goal"
        disabled={busy}
        onClick={() => setConfirming(true)}
      >
        <Trash2 />
      </IconButton>
    );
  }

  return (
    <div className={styles.confirmation} role="group" aria-label={`Delete ${name}?`}>
      <span>{pendingApproval ? "Close any open PayPal approval page." : "Delete goal?"}</span>
      <SettingsInlineButton disabled={busy} onClick={() => setConfirming(false)}>
        Keep
      </SettingsInlineButton>
      <IconButton
        className={styles.delete}
        label={`Confirm deletion of ${name}`}
        title="Confirm deletion"
        disabled={busy}
        onClick={() => void onDelete()}
      >
        <Trash2 />
      </IconButton>
    </div>
  );
}

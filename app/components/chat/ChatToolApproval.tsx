import SettingsInlineButton from "../settings/SettingsInlineButton";
import styles from "./ChatToolApproval.module.css";
const labels: Record<string, string> = {
  pause: "Pause subscription", resume: "Resume subscription", cancel: "Cancel subscription", remove: "Remove goal",
};
export default function ChatToolApproval({ id, action, name, onApprove }: {
  id: string;
  action: string;
  name: string;
  onApprove: (id: string, approved: boolean) => void;
}) {
  return <div className={styles.approval}>
    <span>{labels[action] ?? "Confirm action"} · {name}</span>
    <div>
      <SettingsInlineButton onClick={() => onApprove(id, false)}>Keep</SettingsInlineButton>
      <SettingsInlineButton onClick={() => onApprove(id, true)}>Confirm</SettingsInlineButton>
    </div>
  </div>;
}

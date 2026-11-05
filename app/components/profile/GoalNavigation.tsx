import { ArrowLeft, RefreshCw } from "lucide-react";
import IconButton from "../controls/IconButton";
import LoadingSpinner from "../controls/LoadingSpinner";
import styles from "./GoalNavigation.module.css";
export default function GoalNavigation({
  title,
  onBack,
  onRefresh,
  busy = false,
}: {
  title: string;
  onBack: () => void;
  onRefresh?: () => void;
  busy?: boolean;
}) {
  return (
    <header className={styles.header}>
      <IconButton
        label="Back to goals"
        title="Back to goals"
        onClick={onBack}
        disabled={busy}
      >
        <ArrowLeft />
      </IconButton>
      <span>{title}</span>
      {onRefresh && (
        <IconButton
          label="Refresh goal status"
          title="Refresh goal status"
          onClick={onRefresh}
          disabled={busy}
        >
          {busy ? (
            <LoadingSpinner size={18} label="Updating goal" />
          ) : (
            <RefreshCw />
          )}
        </IconButton>
      )}
    </header>
  );
}

import SettingsInlineButton from "../settings/SettingsInlineButton";
import styles from "./DetailViews.module.css";
export default function DetailViews({
  views,
  value,
  onChange,
}: {
  views: string[];
  value: string;
  onChange: (view: string) => void;
}) {
  return (
    <div className={styles.views} role="group" aria-label="Detail views">
      {views.map((view) => (
        <SettingsInlineButton
          key={view}
          aria-pressed={value === view}
          onClick={() => onChange(view)}
        >
          {view}
        </SettingsInlineButton>
      ))}
    </div>
  );
}

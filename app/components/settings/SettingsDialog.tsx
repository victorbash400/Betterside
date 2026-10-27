import Dialog from "../controls/Dialog";
import styles from "./SettingsDialog.module.css";
export default function SettingsDialog({
  projection,
  onProjection,
  model,
  onModel,
  onClose,
}: {
  projection: "globe" | "mercator";
  onProjection: (value: "globe" | "mercator") => void;
  model: "fast" | "reasoning";
  onModel: (value: "fast" | "reasoning") => void;
  onClose: () => void;
}) {
  return (
    <Dialog title="Settings" onClose={onClose}>
      <div className={styles.group}>
        <div className={styles.row}>
          <span>Appearance</span>
          <span>Light</span>
        </div>
        <div className={styles.row}>
          <span>Map projection</span>
          <div
            className={styles.segment}
            role="group"
            aria-label="Map projection"
          >
            {(["globe", "mercator"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={projection === value}
                onClick={() => onProjection(value)}
              >
                {value === "globe" ? "Globe" : "Flat"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.group}>
        <div className={styles.row}>
          <span>Chat model</span>
          <div className={styles.segment} role="group" aria-label="Chat model">
            {(["fast", "reasoning"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={model === value}
                onClick={() => onModel(value)}
              >
                {value === "fast" ? "Flash" : "Pro"}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.row}>
          <span>
            {model === "fast"
              ? "Gemini 3.0 Flash Preview"
              : "Gemini 3.1 Pro Preview"}
          </span>
        </div>
      </div>
      <div className={styles.group}>
        <div className={styles.row}>
          <span>Payments</span>
          <span>PayPal Sandbox</span>
        </div>
      </div>
    </Dialog>
  );
}

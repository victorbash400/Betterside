import { ArrowLeft, PanelLeftOpen } from "lucide-react";
import IconButton from "../controls/IconButton";
import SettingsGroup from "./SettingsGroup";
import SettingsRow from "./SettingsRow";
import SettingsPicker from "./SettingsPicker";
import styles from "./SettingsDialog.module.css";
export default function SettingsDialog({
  projection,
  onProjection,
  model,
  onModel,
  onClose,
  onNavigation,
}: {
  projection: "globe" | "mercator";
  onProjection: (value: "globe" | "mercator") => void;
  model: "fast" | "reasoning";
  onModel: (value: "fast" | "reasoning") => void;
  onClose: () => void;
  onNavigation: () => void;
}) {
  return (
    <main className={styles.main} aria-label="Settings">
      <div className={styles.content}>
        <header>
          <span className={styles.mobile}>
            <IconButton label="Open navigation" onClick={onNavigation}>
              <PanelLeftOpen />
            </IconButton>
          </span>
          <IconButton label="Back to map" onClick={onClose}>
            <ArrowLeft />
          </IconButton>
          <h1>Settings</h1>
        </header>
        <div className={styles.surface}>
          <SettingsGroup>
            <SettingsRow label="Appearance">
              <span>Light</span>
            </SettingsRow>
            <SettingsRow label="Map projection">
              <SettingsPicker
                label="Map projection"
                value={projection}
                options={[
                  { value: "globe", label: "Globe" },
                  { value: "mercator", label: "Flat" },
                ]}
                onChange={(value) =>
                  onProjection(value as "globe" | "mercator")
                }
              />
            </SettingsRow>
            <SettingsRow label="Chat model">
              <SettingsPicker
                label="Chat model"
                value={model}
                options={[
                  { value: "fast", label: "GLM 4.7 Flash" },
                  { value: "reasoning", label: "GLM 5" },
                ]}
                onChange={(value) => onModel(value as "fast" | "reasoning")}
              />
            </SettingsRow>
            <SettingsRow label="Payments">
              <span>PayPal Sandbox</span>
            </SettingsRow>
          </SettingsGroup>
        </div>
      </div>
    </main>
  );
}

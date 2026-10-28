import { ArrowLeft, PanelLeftOpen } from "lucide-react";
import IconButton from "../controls/IconButton";
import AppearanceSettings from "../appearance/AppearanceSettings";
import { AppearanceSettingsProvider } from "../../state/AppearanceContext";
import ModelSettings from "./ModelSettings";
import PayPalSettings from "./PayPalSettings";
import { settingsSections } from "./SettingsNavigation";
import { useSettingsConfiguration } from "../../state/useSettingsConfiguration";
import type { SettingsSection } from "../../lib/settings";
import type { Appearance } from "../../lib/appearance";
import styles from "./SettingsDialog.module.css";
export default function SettingsDialog({
  section,
  appearance,
  onAppearance,
  model,
  onModel,
  onClose,
  onNavigation,
}: {
  section: SettingsSection;
  appearance: Appearance;
  onAppearance: (value: Appearance) => void;
  model: "fast" | "reasoning";
  onModel: (value: "fast" | "reasoning") => void;
  onClose: () => void;
  onNavigation: () => void;
}) {
  const configuration = useSettingsConfiguration();
  const title = settingsSections.find((item) => item.id === section)!.label;
  return (
    <main className={styles.main} aria-label={title}>
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
          <h1>{title}</h1>
        </header>
        <div className={styles.surface}>
          {section === "appearance" ? (
            <AppearanceSettingsProvider
              value={appearance}
              update={onAppearance}
            >
              <AppearanceSettings />
            </AppearanceSettingsProvider>
          ) : configuration.error ? (
            <div className={styles.error} role="alert">
              {configuration.error}
              <button onClick={configuration.retry}>Retry settings</button>
            </div>
          ) : !configuration.data ? (
            <span role="status">Loading settings</span>
          ) : section === "models" ? (
            <ModelSettings
              value={model}
              onChange={onModel}
              configuration={configuration.data.models}
            />
          ) : (
            <PayPalSettings configuration={configuration.data.paypal} />
          )}
        </div>
      </div>
    </main>
  );
}

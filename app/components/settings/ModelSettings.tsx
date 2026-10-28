import type { SettingsConfiguration } from "../../lib/settings";
import SettingsGroup from "./SettingsGroup";
import SettingsRow from "./SettingsRow";
import SettingsPicker from "./SettingsPicker";
export default function ModelSettings({
  value,
  onChange,
  configuration,
}: {
  value: "fast" | "reasoning";
  onChange: (value: "fast" | "reasoning") => void;
  configuration: SettingsConfiguration["models"];
}) {
  return (
    <SettingsGroup>
      <SettingsRow label="Chat model">
        <SettingsPicker
          label="Chat model"
          value={value}
          options={[
            { value: "fast", label: "Fast" },
            { value: "reasoning", label: "Reasoning" },
          ]}
          onChange={(value) => onChange(value as "fast" | "reasoning")}
        />
      </SettingsRow>
      <SettingsRow label="Fast">
        <span>{configuration.fast ?? "Not configured"}</span>
      </SettingsRow>
      <SettingsRow label="Reasoning">
        <span>{configuration.reasoning ?? "Not configured"}</span>
      </SettingsRow>
      <SettingsRow label="Audio">
        <span>{configuration.audio ?? "Not configured"}</span>
      </SettingsRow>
    </SettingsGroup>
  );
}

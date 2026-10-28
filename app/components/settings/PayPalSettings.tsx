import type { SettingsConfiguration } from "../../lib/settings";
import SettingsGroup from "./SettingsGroup";
import SettingsRow from "./SettingsRow";
export default function PayPalSettings({
  configuration,
}: {
  configuration: SettingsConfiguration["paypal"];
}) {
  return (
    <SettingsGroup>
      <SettingsRow label="Environment">
        <span>{configuration.sandbox ? "Sandbox" : "Disabled"}</span>
      </SettingsRow>
      <SettingsRow label="Currency">
        <span>USD</span>
      </SettingsRow>
      <SettingsRow label="Credentials">
        <span>
          {configuration.credentials ? "Configured" : "Not configured"}
        </span>
      </SettingsRow>
      <SettingsRow label="Webhook">
        <span>{configuration.webhook ? "Configured" : "Not configured"}</span>
      </SettingsRow>
    </SettingsGroup>
  );
}

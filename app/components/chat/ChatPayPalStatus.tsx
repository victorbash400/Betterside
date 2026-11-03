import { useState } from "react";
import type { z } from "zod";
import type { paypalStatusResultSchema } from "../../lib/chatPayPal";
import type { ChatWorkspaceActions } from "../../lib/chatWorkspace";
import SettingsGroup from "../settings/SettingsGroup";
import SettingsRow from "../settings/SettingsRow";
import SettingsInlineButton from "../settings/SettingsInlineButton";
export default function ChatPayPalStatus({ status, actions }: {
  status: z.infer<typeof paypalStatusResultSchema>;
  actions: ChatWorkspaceActions;
}) {
  const [error, setError] = useState("");
  return <div>
    <SettingsGroup>
      <SettingsRow label="PayPal"><span>{status.connected ? status.name || "Connected" : status.configured ? "Not connected" : "Not configured"}</span></SettingsRow>
      <SettingsRow label="Environment"><span>Sandbox</span></SettingsRow>
      <SettingsRow label="Checkout">
        <SettingsInlineButton disabled={!status.checkoutConfigured} onClick={() => {
          setError("");
          void actions.openCheckout({}).catch((failure) => setError(failure instanceof Error ? failure.message : "Checkout unavailable."));
        }}>Open checkout</SettingsInlineButton>
      </SettingsRow>
    </SettingsGroup>
    {error && <span role="alert">{error}</span>}
  </div>;
}

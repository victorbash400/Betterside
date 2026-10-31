import { usePayPalAccount } from "../../state/usePayPalAccount";
import SettingsGroup from "../settings/SettingsGroup";
import SettingsRow from "../settings/SettingsRow";
import SettingsActionRow from "../settings/SettingsActionRow";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import styles from "./ProfilePayments.module.css";
export default function ProfilePayments({
  onCheckout,
  onContributions,
}: {
  onCheckout: () => void;
  onContributions: () => void;
}) {
  const paypal = usePayPalAccount();
  return (
    <section aria-label="Payment account">
      <SettingsGroup>
        <SettingsRow label="PayPal account">
          {paypal.account?.connected ? (
            <>
              <span>{paypal.account.name ?? "Connected"}</span>
              <SettingsInlineButton
                disabled={paypal.busy}
                onClick={() => void paypal.disconnect()}
              >
                Disconnect
              </SettingsInlineButton>
            </>
          ) : paypal.account?.configured ? (
            <SettingsInlineButton
              disabled={paypal.busy}
              onClick={() => void paypal.connect()}
            >
              {paypal.busy ? "Connecting" : "Connect PayPal"}
            </SettingsInlineButton>
          ) : (
            <span>{paypal.account ? "Not configured" : "Loading"}</span>
          )}
        </SettingsRow>
        <SettingsActionRow onClick={onCheckout}>Contribute</SettingsActionRow>
        <SettingsActionRow onClick={onContributions}>
          Contribution history
        </SettingsActionRow>
        <SettingsRow label="Manage PayPal">
          <a
            className={styles.link}
            href="https://www.sandbox.paypal.com/myaccount/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open PayPal
          </a>
        </SettingsRow>
      </SettingsGroup>
      {paypal.error && (
        <div className={styles.error} role="alert">
          {paypal.error}
          <button onClick={paypal.retry}>Retry</button>
        </div>
      )}
    </section>
  );
}

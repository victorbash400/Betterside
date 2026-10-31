import { usePayPalAccount } from "../../state/usePayPalAccount";
import { ArrowUpRight } from "lucide-react";
import styles from "./ProfilePayments.module.css";
export default function ProfilePayments({
  onCheckout,
  onContributions,
  onSettings,
}: {
  onCheckout: () => void;
  onContributions: () => void;
  onSettings: () => void;
}) {
  const paypal = usePayPalAccount();
  return (
    <section className={styles.payments} aria-label="Payment account">
      <header>
        <h2>PayPal</h2>
        <span>Sandbox</span>
      </header>
      <div>
        <button onClick={onCheckout}>Contribute</button>
        <button onClick={onContributions}>History</button>
      </div>
      {paypal.account?.connected && (
        <span className={styles.linked}>
          {paypal.account.name ?? "PayPal account"} · Connected
        </span>
      )}
      {paypal.account?.configured && !paypal.account.connected && (
        <button
          className={styles.connect}
          disabled={paypal.busy}
          onClick={() => void paypal.connect()}
        >
          {paypal.busy ? "Connecting" : "Connect PayPal"}
        </button>
      )}
      {paypal.account?.connected && (
        <button
          className={styles.settings}
          disabled={paypal.busy}
          onClick={() => void paypal.disconnect()}
        >
          Disconnect PayPal
        </button>
      )}
      {paypal.error && (
        <div className={styles.error} role="alert">
          {paypal.error}
          <button onClick={paypal.retry}>Retry</button>
        </div>
      )}
      <a
        href="https://www.sandbox.paypal.com/myaccount/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Manage PayPal account
        <ArrowUpRight size={13} />
      </a>
      <button className={styles.settings} onClick={onSettings}>
        Payment settings
      </button>
    </section>
  );
}

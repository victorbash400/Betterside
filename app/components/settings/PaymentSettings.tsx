import ProfilePayments from "../profile/ProfilePayments";
import PayPalSettings from "./PayPalSettings";
import type { SettingsConfiguration } from "../../lib/settings";
import styles from "../profile/ProfileSettings.module.css";
export default function PaymentSettings({
  configuration,
  onCheckout,
  onContributions,
}: {
  configuration: SettingsConfiguration["paypal"];
  onCheckout: () => void;
  onContributions: () => void;
}) {
  return (
    <div className={styles.profile}>
      <ProfilePayments
        onCheckout={onCheckout}
        onContributions={onContributions}
      />
      <PayPalSettings configuration={configuration} />
    </div>
  );
}

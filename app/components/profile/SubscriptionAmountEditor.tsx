import { useState } from "react";
import LoadingSpinner from "../controls/LoadingSpinner";
import SettingsGroup from "../settings/SettingsGroup";
import SettingsRow from "../settings/SettingsRow";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import { amountInCents } from "../../lib/payment";
import styles from "./SubscriptionAmountEditor.module.css";
export default function SubscriptionAmountEditor({
  amount,
  busy,
  onCancel,
  onSave,
}: {
  amount: string;
  busy: boolean;
  onCancel: () => void;
  onSave: (amount: string) => Promise<void>;
}) {
  const [value, setValue] = useState(amount);
  const [error, setError] = useState("");
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        try {
          amountInCents(value);
          void onSave(value);
        } catch (failure) {
          setError(
            failure instanceof Error
              ? failure.message
              : "Enter a valid amount.",
          );
        }
      }}
    >
      <SettingsGroup>
        <SettingsRow label="Monthly · USD">
          <input
            className={styles.input}
            aria-label="New monthly amount in USD"
            inputMode="decimal"
            required
            value={value}
            disabled={busy}
            onChange={(event) => setValue(event.target.value)}
          />
        </SettingsRow>
      </SettingsGroup>
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
      <footer className={styles.actions}>
        <SettingsInlineButton disabled={busy} onClick={onCancel}>
          Cancel
        </SettingsInlineButton>
        <button
          type="submit"
          disabled={busy || value === amount}
          className={styles.submit}
        >
          {busy ? (
            <LoadingSpinner size={18} label="Preparing change" />
          ) : (
            "Continue in PayPal"
          )}
        </button>
      </footer>
    </form>
  );
}

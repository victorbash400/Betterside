import LoadingSpinner from "../controls/LoadingSpinner";
import { useState } from "react";
import { newPasswordSchema, accountSchema } from "../../lib/account";
import { accountRequest } from "../../lib/accountApi";
import { useAccount } from "../../state/AccountContext";
import AccountField from "./AccountField";
import SettingsRow from "../settings/SettingsRow";
import styles from "./AccountPasswordForm.module.css";
export default function AccountPasswordForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const account = useAccount();
  const [current, setCurrent] = useState(""),
    [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save() {
    setBusy(true);
    setError("");
    try {
      const next = newPasswordSchema.safeParse(password);
      if (!next.success) throw new Error(next.error.issues[0].message);
      const result = await accountRequest(
        "/api/account",
        { action: "password", currentPassword: current, password },
        account.fetch,
        "PATCH",
      );
      account.update(accountSchema.parse(result.user));
      onClose();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not change password.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <SettingsRow label="Current password">
        <AccountField
          variant="settings"
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          disabled={busy}
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
        />
      </SettingsRow>
      <SettingsRow label="New password">
        <AccountField
          variant="settings"
          label="New password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={256}
          required
          disabled={busy}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </SettingsRow>
      {error && <span role="alert">{error}</span>}
      <div className={styles.actions}>
        <button type="button" disabled={busy} onClick={onClose}>
          Cancel
        </button>
        <button
          aria-label="Save password"
          aria-busy={busy}
          disabled={busy || !current || password.length < 12}
        >
          {busy ? (
            <LoadingSpinner size={24} label="Saving password" />
          ) : (
            "Save password"
          )}
        </button>
      </div>
    </form>
  );
}

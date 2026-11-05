import LoadingSpinner from "../controls/LoadingSpinner";
import SettingsGroup from "../settings/SettingsGroup";
import SettingsRow from "../settings/SettingsRow";
import SettingsActionRow from "../settings/SettingsActionRow";
import { useState } from "react";
import { useAccount } from "../../state/AccountContext";
import { accountRequest } from "../../lib/accountApi";
import { accountSchema } from "../../lib/account";
import ProfileIdentity from "../profile/ProfileIdentity";
import AccountPasswordForm from "./AccountPasswordForm";
import styles from "./ProfileAccount.module.css";
export default function ProfileAccount() {
  const account = useAccount();
  const [saving, setSaving] = useState(false),
    [passwordOpen, setPasswordOpen] = useState(false);
  const user = account.user!;
  return (
    <div className={styles.account}>
      <SettingsGroup>
        <ProfileIdentity
          key={user.name}
          name={user.name}
          busy={saving || account.busy || user.demo}
          onSave={async (name) => {
            setSaving(true);
            try {
              const result = await accountRequest(
                "/api/account",
                { action: "name", name },
                account.fetch,
                "PATCH",
              );
              account.update(accountSchema.parse(result.user));
            } finally {
              setSaving(false);
            }
          }}
        />
        <SettingsRow label="Email">
          <span>{user.email}</span>
        </SettingsRow>
        {!user.demo &&
          (passwordOpen ? (
            <AccountPasswordForm onClose={() => setPasswordOpen(false)} />
          ) : (
            <SettingsActionRow onClick={() => setPasswordOpen(true)}>
              Change password
            </SettingsActionRow>
          ))}
        <SettingsActionRow
          disabled={saving || account.busy}
          onClick={() => void account.signOut()}
        >
          {account.busy ? (
            <LoadingSpinner size={24} label="Signing out" />
          ) : (
            "Sign out"
          )}
        </SettingsActionRow>
      </SettingsGroup>
      {account.error && (
        <span className={styles.error} role="alert">
          {account.error}
        </span>
      )}
    </div>
  );
}

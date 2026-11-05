import LoadingSpinner from "../controls/LoadingSpinner";
import { useState } from "react";
import SettingsRow from "../settings/SettingsRow";
import SettingsInlineButton from "../settings/SettingsInlineButton";
import styles from "./ProfileIdentity.module.css";
export default function ProfileIdentity({
  name,
  busy,
  onSave,
}: {
  name: string;
  busy: boolean;
  onSave: (name: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState("");
  return (
    <div>
      <SettingsRow label="Name">
        {editing ? (
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              setError("");
              void onSave(draft)
                .then(() => setEditing(false))
                .catch((failure) =>
                  setError(
                    failure instanceof Error
                      ? failure.message
                      : "Could not save name.",
                  ),
                );
            }}
          >
            <input
              aria-label="Name"
              value={draft}
              maxLength={100}
              disabled={busy}
              onChange={(event) => setDraft(event.target.value)}
              autoComplete="name"
              autoFocus
            />
            <SettingsInlineButton
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              Cancel
            </SettingsInlineButton>
            <SettingsInlineButton type="submit" disabled={busy}>
              {busy ? <LoadingSpinner size={24} label="Saving name" /> : "Save"}
            </SettingsInlineButton>
          </form>
        ) : (
          <>
            <span>{name || "—"}</span>
            <SettingsInlineButton
              disabled={busy}
              onClick={() => {
                setDraft(name);
                setEditing(true);
              }}
            >
              Edit
            </SettingsInlineButton>
          </>
        )}
      </SettingsRow>
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

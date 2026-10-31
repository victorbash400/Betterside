import { useState } from "react";
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
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState("");
  return (
    <form
      className={styles.identity}
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        void onSave(draft).catch((failure) =>
          setError(
            failure instanceof Error ? failure.message : "Could not save name.",
          ),
        );
      }}
    >
      <label htmlFor="profile-name">Name</label>
      <div>
        <input
          id="profile-name"
          value={draft}
          maxLength={100}
          disabled={busy}
          onChange={(event) => setDraft(event.target.value)}
          autoComplete="name"
        />
        {draft.trim() !== name && <button disabled={busy}>Save</button>}
      </div>
      {error && <span role="alert">{error}</span>}
    </form>
  );
}

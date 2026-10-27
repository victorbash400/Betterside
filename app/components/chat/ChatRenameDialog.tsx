import { useState } from "react";
import Dialog from "../controls/Dialog";
import styles from "./ChatRenameDialog.module.css";
export default function ChatRenameDialog({
  title,
  onSubmit,
  onClose,
}: {
  title: string;
  onSubmit: (title: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(title);
  return (
    <Dialog title="Rename chat" onClose={onClose}>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          if (value.trim()) onSubmit(value.trim());
        }}
      >
        <input
          autoFocus
          aria-label="Chat name"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={120}
        />
        <div>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button disabled={!value.trim()}>Rename</button>
        </div>
      </form>
    </Dialog>
  );
}

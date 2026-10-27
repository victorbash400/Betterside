import { useEffect, useRef, useState } from "react";
import Dialog from "../controls/Dialog";
import styles from "./NewInterestDialog.module.css";
export default function NewInterestDialog({
  onCreate,
  onClose,
}: {
  onCreate: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
  }, []);
  return (
    <Dialog title="New interest" onClose={onClose}>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) onCreate(name.trim());
        }}
      >
        <input
          ref={input}
          autoFocus
          aria-label="Interest name"
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
        />
        <div>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button disabled={!name.trim()}>Create</button>
        </div>
      </form>
    </Dialog>
  );
}

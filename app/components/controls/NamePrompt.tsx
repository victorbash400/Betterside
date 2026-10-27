import { useEffect, useRef, useState } from "react";
import styles from "./NamePrompt.module.css";
export default function NamePrompt({
  label,
  initial,
  onSubmit,
  onClose,
}: {
  label: string;
  initial: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.showModal();
    input.current?.focus();
    input.current?.select();
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) onSubmit(name.trim());
        }}
      >
        <label>
          {label}
          <input
            ref={input}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
          />
        </label>
        <div className={styles.actions}>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button disabled={!name.trim()}>Save</button>
        </div>
      </form>
    </dialog>
  );
}

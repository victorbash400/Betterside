import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import IconButton from "./IconButton";
import styles from "./Dialog.module.css";
export default function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    const dialog = ref.current;
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header>
        <span>{title}</span>
        <IconButton label={`Close ${title.toLowerCase()}`} onClick={onClose}>
          <X />
        </IconButton>
      </header>
      {children}
    </dialog>
  );
}

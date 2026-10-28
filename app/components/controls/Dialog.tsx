import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import IconButton from "./IconButton";
import styles from "./Dialog.module.css";
export default function Dialog({
  title,
  onClose,
  children,
  animated = false,
  compact = false,
  size = "standard",
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  animated?: boolean;
  compact?: boolean;
  size?: "standard" | "profile";
  footer?: ReactNode;
}) {
  const [closing, setClosing] = useState(false);
  function dismiss() {
    if (
      !animated ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      onClose();
    else setClosing(true);
  }
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    const dialog = ref.current;
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${animated ? styles.animated : ""}`}
      data-size={size}
      data-compact={compact}
      data-closing={closing}
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) onClose();
      }}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          dismiss();
      }}
    >
      <header>
        <span>{title}</span>
        <IconButton label={`Close ${title.toLowerCase()}`} onClick={dismiss}>
          <X />
        </IconButton>
      </header>
      <div className={styles.body}>{children}</div>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </dialog>
  );
}

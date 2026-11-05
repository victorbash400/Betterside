import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import IconButton from "./IconButton";
import styles from "./Dialog.module.css";
export default function Dialog({
  title,
  id,
  onClose,
  children,
  animated = false,
  compact = false,
  centered = false,
  size = "standard",
  footer,
  modal = true,
}: {
  title: string;
  id?: string;
  onClose: () => void;
  children: ReactNode;
  animated?: boolean;
  compact?: boolean;
  centered?: boolean;
  size?: "standard" | "profile" | "payment" | "history" | "goals" | "analysis" | "insights";
  footer?: ReactNode;
  modal?: boolean;
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
    if (modal) ref.current?.showModal();
    else ref.current?.show();
    const dialog = ref.current;
    return () => dialog?.close();
  }, [modal]);
  return (
    <dialog
      ref={ref}
      id={id}
      className={`${styles.dialog} ${animated ? styles.animated : ""}`}
      data-size={size}
      data-centered={centered}
      data-modal={modal}
      data-compact={compact}
      data-closing={closing}
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) onClose();
      }}
      aria-label={title}
      aria-modal={modal}
      onKeyDown={(event) => {
        if (!modal && event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault();
          event.stopPropagation();
          dismiss();
        }
      }}
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

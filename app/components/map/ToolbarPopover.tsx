import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./ToolbarPopover.module.css";
export default function ToolbarPopover({
  label,
  x,
  y,
  onClose,
  children,
}: {
  label: string;
  x: number;
  y: number;
  onClose: () => void;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  const [position, setPosition] = useState({ left: x, top: y });
  useLayoutEffect(() => {
    const previous = document.activeElement;
    const rect = root.current!.getBoundingClientRect();
    setPosition({
      left: Math.max(8, Math.min(x, window.innerWidth - rect.width - 8)),
      top: Math.max(8, Math.min(y, window.innerHeight - rect.height - 8)),
    });
    root.current?.querySelector<HTMLElement>("button, input")?.focus();
    const dismiss = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (previous instanceof HTMLElement && previous.contains(target)) return;
      if (!root.current?.contains(target) && !target.closest('[role="menu"]'))
        close.current();
    };
    const resize = () => close.current();
    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("resize", resize);
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [x, y]);
  return createPortal(
    <div
      ref={root}
      role="dialog"
      aria-label={label}
      className={styles.popover}
      style={position}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          close.current();
        }
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

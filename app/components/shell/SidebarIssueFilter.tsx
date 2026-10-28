import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { issueKinds } from "../../lib/catalogue";
import type { IssueKind } from "../../lib/types";
import styles from "./SidebarIssueFilter.module.css";
export default function SidebarIssueFilter({
  value,
  onChange,
}: {
  value: IssueKind[];
  onChange: (value: IssueKind[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  return (
    <div
      ref={root}
      className={`${styles.filter} ${open ? styles.expanded : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
        if (open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
          event.preventDefault();
          const buttons = Array.from(
            root.current?.querySelectorAll<HTMLButtonElement>(
              "[role=checkbox]",
            ) ?? [],
          );
          const index = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            ),
            next = index + (event.key === "ArrowDown" ? 1 : -1);
          if (next < 0) trigger.current?.focus();
          else buttons[Math.min(next, buttons.length - 1)]?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        className={styles.trigger}
        aria-expanded={open}
        aria-controls="sidebar-issue-options"
        onClick={() => setOpen((value) => !value)}
      >
        <SlidersHorizontal size={18} strokeWidth={1.8} />
        <span>Causes</span>
        <ChevronDown size={14} className={open ? styles.rotated : undefined} />
      </button>
      {open && (
        <div
          id="sidebar-issue-options"
          className={styles.options}
          role="group"
          aria-label="Visible causes"
        >
          {issueKinds.map((kind) => (
            <button
              key={kind}
              role="checkbox"
              aria-checked={value.includes(kind)}
              onClick={() =>
                onChange(
                  value.includes(kind)
                    ? value.filter((item) => item !== kind)
                    : [...value, kind],
                )
              }
            >
              <span>{kind}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

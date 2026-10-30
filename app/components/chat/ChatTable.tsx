import type { ReactNode } from "react";
import styles from "./ChatTable.module.css";
export default function ChatTable({
  children,
  className = "",
  label = "Message table",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={`${styles.frame} ${className}`}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      <table className={styles.table}>{children}</table>
    </div>
  );
}

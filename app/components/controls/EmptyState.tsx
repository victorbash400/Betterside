import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

export default function EmptyState({
  children,
  overlay = false,
}: {
  children: ReactNode;
  overlay?: boolean;
}) {
  return (
    <div className={styles.empty} data-overlay={overlay} role="status">
      {children}
    </div>
  );
}

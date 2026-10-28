import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import styles from "./DataCardHeader.module.css";
export default function DataCardHeader({
  title,
  label,
  Icon,
  value,
  unit,
  action,
}: {
  title: string;
  label: string;
  Icon: LucideIcon;
  value?: string;
  unit?: string;
  action: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <Icon size={21} aria-hidden="true" />
        <span>{label}</span>
        <div className={styles.actions}>{action}</div>
      </div>
      <h2>{title}</h2>
      {value !== undefined && <strong className={styles.value}>{value}</strong>}
      {unit && <span className={styles.unit}>{unit}</span>}
    </header>
  );
}

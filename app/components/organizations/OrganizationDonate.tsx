import { ArrowUpRight } from "lucide-react";
import styles from "./OrganizationDonate.module.css";
export default function OrganizationDonate({
  url,
  name,
}: {
  url: string | null;
  name: string;
}) {
  return url ? (
    <a
      className={styles.action}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Donate to ${name}`}
    >
      Donate
      <ArrowUpRight size={13} />
    </a>
  ) : (
    <button
      className={styles.action}
      disabled
      title="No verified donation link"
    >
      Donate
    </button>
  );
}

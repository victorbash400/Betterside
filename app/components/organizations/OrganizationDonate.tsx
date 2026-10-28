import { ArrowUpRight } from "lucide-react";
import styles from "./OrganizationDonate.module.css";
export default function OrganizationDonate({
  url,
  name,
  prominent = false,
}: {
  url: string | null;
  name: string;
  prominent?: boolean;
}) {
  return url ? (
    <a
      className={styles.action}
      data-prominent={prominent}
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
      data-prominent={prominent}
      disabled
      title="No verified donation link"
    >
      Donate
    </button>
  );
}

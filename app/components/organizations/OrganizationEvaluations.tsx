import { ArrowUpRight } from "lucide-react";
import type { DirectoryOrganization } from "../../lib/organizations";
import styles from "./OrganizationEvaluations.module.css";

export default function OrganizationEvaluations({
  organization,
}: {
  organization: DirectoryOrganization;
}) {
  if (!organization.evaluations.length) return null;
  return (
    <div className={styles.evaluations} aria-label="Published evaluations">
      {organization.evaluations.map((item) => (
        <a
          key={item.url}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.label}
          <ArrowUpRight size={13} />
        </a>
      ))}
    </div>
  );
}

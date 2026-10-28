import { ArrowUpRight } from "lucide-react";
import type { DirectoryOrganization } from "../../lib/organizations";
import styles from "./OrganizationEvidence.module.css";
export default function OrganizationEvidence({
  organization,
}: {
  organization: DirectoryOrganization;
}) {
  return (
    <div className={styles.evidence}>
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
      {organization.sources.map((item) => (
        <a
          key={item.url}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>
            {item.label}
            {item.date && (
              <small>
                Date{" "}
                {new Date(item.date).toLocaleDateString("en", {
                  dateStyle: "medium",
                })}
              </small>
            )}
          </span>
          <ArrowUpRight size={13} />
        </a>
      ))}
    </div>
  );
}

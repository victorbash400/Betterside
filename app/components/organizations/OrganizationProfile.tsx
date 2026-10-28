import { ChevronDown, ArrowUpRight } from "lucide-react";
import type { DirectoryOrganization } from "../../lib/organizations";
import OrganizationOverview from "./OrganizationOverview";
import OrganizationLocations from "./OrganizationLocations";
import OrganizationEvidence from "./OrganizationEvidence";
import styles from "./OrganizationProfile.module.css";
export default function OrganizationProfile({
  organization,
  onCountry,
}: {
  organization: DirectoryOrganization;
  onCountry: (country: string) => void;
}) {
  return (
    <div className={styles.profile}>
      <section
        className={styles.overview}
        aria-label="Organization information"
      >
        {organization.type && (
          <p className={styles.type}>{organization.type}</p>
        )}
        <OrganizationOverview organization={organization} />
        {organization.evaluations.length > 0 && (
          <section
            className={styles.evaluations}
            aria-label="Published evaluations"
          >
            <h3>Evaluations</h3>
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
          </section>
        )}
      </section>
      {organization.presence.length > 0 && (
        <section
          className={styles.locations}
          aria-label="Reported operating areas"
        >
          <h3>Where they work</h3>
          <OrganizationLocations
            organization={organization}
            onCountry={onCountry}
          />
        </section>
      )}
      <details className={styles.sources}>
        <summary>
          Sources <ChevronDown size={14} />
        </summary>
        <OrganizationEvidence organization={organization} />
      </details>
    </div>
  );
}

import type { DirectoryOrganization } from "../../lib/organizations";
import OrganizationOverview from "./OrganizationOverview";
import OrganizationLocations from "./OrganizationLocations";
import OrganizationEvidence from "./OrganizationEvidence";
import OrganizationEvaluations from "./OrganizationEvaluations";
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
      {organization.type && (
        <span className={styles.type}>{organization.type}</span>
      )}
      <OrganizationOverview organization={organization} />
      {organization.presence.length > 0 && (
        <OrganizationLocations
          organization={organization}
          onCountry={onCountry}
        />
      )}
      <OrganizationEvaluations organization={organization} />
      {organization.sources.length > 0 && (
        <OrganizationEvidence organization={organization} />
      )}
    </div>
  );
}

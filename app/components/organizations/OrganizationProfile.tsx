import { useState } from "react";
import type { DirectoryOrganization } from "../../lib/organizations";
import OrganizationOverview from "./OrganizationOverview";
import OrganizationLocations from "./OrganizationLocations";
import OrganizationEvidence from "./OrganizationEvidence";
import OrganizationProfileTabs from "./OrganizationProfileTabs";
import OrganizationEvaluations from "./OrganizationEvaluations";
import styles from "./OrganizationProfile.module.css";
export default function OrganizationProfile({
  organization,
  onCountry,
}: {
  organization: DirectoryOrganization;
  onCountry: (country: string) => void;
}) {
  const [view, setView] = useState("Overview");
  return (
    <div className={styles.profile}>
      <OrganizationProfileTabs
        value={view}
        areas={organization.presence.length}
        onChange={setView}
      />
      <section
        className={styles.content}
        aria-label={`${organization.name} ${view.toLowerCase()}`}
      >
        {view === "Overview" ? (
          <>
            {organization.type && (
              <span className={styles.type}>{organization.type}</span>
            )}
            <OrganizationOverview organization={organization} />
            <OrganizationEvaluations organization={organization} />
          </>
        ) : view === "Areas" ? (
          <OrganizationLocations
            organization={organization}
            onCountry={onCountry}
          />
        ) : (
          <OrganizationEvidence organization={organization} />
        )}
      </section>
    </div>
  );
}

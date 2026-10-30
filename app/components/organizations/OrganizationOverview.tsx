import type { DirectoryOrganization } from "../../lib/organizations";
import { Fragment } from "react";
import styles from "./OrganizationOverview.module.css";
export default function OrganizationOverview({
  organization,
}: {
  organization: DirectoryOrganization;
}) {
  const countries = new Set(
    organization.presence.map((area) => area.countryCode),
  ).size;
  return (
    <>
      {organization.description && <p>{organization.description}</p>}
      <dl className={styles.facts}>
        {organization.topics.length > 0 && (
          <>
            <dt>Focus</dt>
            <dd>{organization.topics.join(", ")}</dd>
          </>
        )}
        {organization.presence.length > 0 && (
          <>
            <dt>Reported coverage</dt>
            <dd>
              {countries} {countries === 1 ? "country" : "countries"}
            </dd>
          </>
        )}
        {organization.size && (
          <>
            <dt>{organization.size.label}</dt>
            <dd>
              {organization.size.value}
              <a
                href={organization.size.evidence.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {organization.size.evidence.label}
              </a>
            </dd>
          </>
        )}
        {organization.identifiers
          .filter((id) => id.scheme !== "BetterSide reviewed profile")
          .map((id) => (
            <Fragment key={JSON.stringify(id)}>
              <dt>{id.scheme}</dt>
              <dd>{id.value}</dd>
            </Fragment>
          ))}
      </dl>
    </>
  );
}

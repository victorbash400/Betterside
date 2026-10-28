import { ArrowUpRight, Building2, ChevronDown } from "lucide-react";
import type { ResponseOrganization } from "../../lib/responseOrganizations";
import { formatDate } from "../../lib/dates";
import CardFacts from "./CardFacts";
import styles from "./OrganizationRow.module.css";
export default function OrganizationRow({
  organization,
}: {
  organization: ResponseOrganization;
}) {
  return (
    <li className={styles.row}>
      <details>
        <summary>
          <span className={styles.icon}>
            <Building2 size={19} />
          </span>
          <span className={styles.identity}>
            <strong>{organization.name}</strong>
            <span>{organization.type ?? organization.acronym}</span>
          </span>
          <ChevronDown size={14} />
        </summary>

        <div className={styles.evidence}>
          <CardFacts
            entries={[
              {
                label: "Reference from",
                value: formatDate(organization.start, "UTC"),
              },
              {
                label: "Reference through",
                value: organization.end
                  ? formatDate(organization.end, "UTC")
                  : "Not reported",
              },
            ]}
          />
          {organization.locations.length > 0 && (
            <details className={styles.locations}>
              <summary>Locations ({organization.locations.length})</summary>
              <ul>
                {organization.locations.map((location) => (
                  <li key={location}>{location}</li>
                ))}
              </ul>
            </details>
          )}
          {organization.sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              HDX · updated {formatDate(source.updated, "UTC")}
              <ArrowUpRight size={13} />
            </a>
          ))}
        </div>
      </details>
      <div className={styles.preview}>
        <span>{organization.sectors.join(", ")}</span>
        <strong>
          {organization.areas} {organization.areas === 1 ? "area" : "areas"}
        </strong>
      </div>
      <span className={styles.period}>
        {organization.end ? "Through" : "From"}{" "}
        {formatDate(organization.end ?? organization.start, "UTC")}
      </span>
    </li>
  );
}

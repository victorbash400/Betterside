import type { DirectoryOrganization } from "../../lib/organizations";
import styles from "./OrganizationLocations.module.css";
export default function OrganizationLocations({
  organization,
  onCountry,
}: {
  organization: DirectoryOrganization;
  onCountry: (country: string) => void;
}) {
  return (
    <div className={styles.locations}>
      {organization.presence.map((area, index) => (
        <article
          key={JSON.stringify([
            area.countryCode,
            area.areaCode,
            area.region,
            area.start,
            index,
          ])}
        >
          <button onClick={() => onCountry(area.country)}>
            {area.region ? `${area.region}, ${area.country}` : area.country}
          </button>
          {area.sectors.length > 0 && <span>{area.sectors.join(", ")}</span>}
          {area.start && (
            <time>
              {new Date(area.start).toLocaleDateString("en", {
                dateStyle: "medium",
              })}
              {area.end
                ? ` – ${new Date(area.end).toLocaleDateString("en", { dateStyle: "medium" })}`
                : ""}
            </time>
          )}
          <a href={area.evidence.url} target="_blank" rel="noopener noreferrer">
            {area.evidence.label}
          </a>
        </article>
      ))}
    </div>
  );
}

import type { DirectoryOrganization } from "../../lib/organizations";
import { Info } from "lucide-react";
import IconButton from "../controls/IconButton";
import OrganizationDonate from "./OrganizationDonate";
import styles from "./OrganizationDirectoryRow.module.css";
export default function OrganizationDirectoryRow({
  organization,
  selected,
  onSelect,
  compact = false,
  onDetails,
}: {
  organization: DirectoryOrganization;
  selected: boolean;
  onSelect: () => void;
  compact?: boolean;
  onDetails?: () => void;
}) {
  const countries = new Set(
    organization.presence.map((area) => area.countryCode),
  ).size;
  return (
    <div className={styles.row} data-selected={selected} data-compact={compact}>
      <button
        className={styles.select}
        onClick={onSelect}
        aria-pressed={selected}
      >
        <span>
          {organization.name}
          <small>{organization.topics.join(", ") || organization.type}</small>
        </span>
      </button>
      {onDetails && (
        <IconButton
          label={`Details for ${organization.name}`}
          onClick={onDetails}
        >
          <Info size={15} />
        </IconButton>
      )}
      {!compact && (
        <span className={styles.countries}>
          {countries
            ? `${countries} ${countries === 1 ? "country" : "countries"}`
            : "—"}
        </span>
      )}
      {!compact && (
        <OrganizationDonate
          url={organization.donateUrl}
          name={organization.name}
        />
      )}
    </div>
  );
}

import SettingsPicker from "../settings/SettingsPicker";
import type {
  DirectoryOrganization,
  OrganizationFilters,
} from "../../lib/organizations";
import toolbar from "../map/WorkspaceToolbar.module.css";
export default function OrganizationFilterFields({
  filters,
  onChange,
  organizations,
}: {
  filters: OrganizationFilters;
  onChange: (filters: OrganizationFilters) => void;
  organizations: DirectoryOrganization[];
}) {
  return (
    <div className={toolbar.rows}>
      <label>
        Sector
        <SettingsPicker
          label="Reported sector"
          value={filters.sector}
          options={[
            { value: "", label: "All sectors" },
            ...[
              ...new Set(
                organizations.flatMap((org) =>
                  org.presence.flatMap((area) => area.sectors),
                ),
              ),
            ]
              .sort()
              .map((value) => ({ value, label: value })),
          ]}
          onChange={(sector) => onChange({ ...filters, sector })}
        />
      </label>
      <label>
        Type
        <SettingsPicker
          label="Organization type"
          value={filters.type}
          options={[
            { value: "", label: "All types" },
            ...[
              ...new Set(
                organizations.flatMap((org) => (org.type ? [org.type] : [])),
              ),
            ]
              .sort()
              .map((value) => ({ value, label: value })),
          ]}
          onChange={(type) => onChange({ ...filters, type })}
        />
      </label>
      <label>
        Donations
        <SettingsPicker
          label="Donation links"
          value={filters.donation}
          options={[
            { value: "", label: "All organizations" },
            { value: "verified", label: "Verified donation link" },
          ]}
          onChange={(donation) => onChange({ ...filters, donation })}
        />
      </label>
      {(filters.sector ||
        filters.type ||
        filters.donation ||
        filters.topic ||
        filters.country) && (
        <button
          className={toolbar.reset}
          onClick={() =>
            onChange({
              ...filters,
              type: "",
              donation: "",
              country: "",
              topic: "",
            })
          }
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

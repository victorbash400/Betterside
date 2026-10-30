import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import {
  organizationCauseTopics,
  type DirectoryOrganization,
} from "../../lib/organizations";
import drawer from "../map/MapDrawer.module.css";
import IconButton from "../controls/IconButton";
import OrganizationCauseOptions from "./OrganizationCauseOptions";
import styles from "./OrganizationIssues.module.css";
export default function OrganizationIssues({
  open,
  organization,
  value,
  onChange,
  onClearOrganization,
  onSettings,
}: {
  open: boolean;
  organization?: DirectoryOrganization;
  value: string[];
  onChange: (topics: string[]) => void;
  onClearOrganization: () => void;
  onSettings: () => void;
}) {
  const topics = organizationCauseTopics(organization);
  return (
    <aside
      id="map-causes-drawer"
      className={`${styles.panel} ${drawer.drawer}`}
      data-side="right"
      inert={!open}
      aria-hidden={!open}
      data-open={open}
      aria-label={
        organization ? `Causes for ${organization.name}` : "Organization causes"
      }
    >
      <div className={styles.header}>
        {organization && (
          <IconButton
            label="All causes"
            title="Clear organization selection"
            onClick={onClearOrganization}
          >
            <ArrowLeft size={14} />
          </IconButton>
        )}
        <div className={styles.heading}>
          <span>Causes</span>
          <small>{topics.length}</small>
        </div>
      </div>
      <OrganizationCauseOptions
        options={topics}
        value={value}
        onChange={onChange}
      />
      <button className={styles.settings} onClick={onSettings}>
        <SlidersHorizontal size={14} />
        Layer settings
      </button>
    </aside>
  );
}

import { ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import {
  organizationCauseTopics,
  type DirectoryOrganization,
} from "../../lib/organizations";
import drawer from "../map/MapDrawer.module.css";
import IconButton from "../controls/IconButton";
import MapLayerGrid from "../map/MapLayerGrid";
import styles from "./OrganizationIssues.module.css";
export default function OrganizationIssues({
  open,
  onClose,
  organization,
  value,
  onChange,
  onClearOrganization,
  onSettings,
}: {
  open: boolean;
  onClose: () => void;
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
      style={{ height: Math.min(540, 114 + topics.length * 32) }}
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
        <IconButton label="Close causes" onClick={onClose}>
          <X size={16} />
        </IconButton>
      </div>
      <MapLayerGrid
        rows={topics.map((topic) => ({ id: topic, label: topic }))}
        selected={value}
        onChange={onChange}
      />
      <button className={styles.settings} onClick={onSettings}>
        <SlidersHorizontal size={14} />
        Layer settings
      </button>
    </aside>
  );
}

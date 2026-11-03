import { X } from "lucide-react";
import IconButton from "../controls/IconButton";
import OrganizationSearch from "./OrganizationSearch";
import type { DirectoryOrganization } from "../../lib/organizations";
import OrganizationMapGrid from "./OrganizationMapGrid";
import drawer from "../map/MapDrawer.module.css";
import styles from "./OrganizationRail.module.css";
export default function OrganizationRail({
  open,
  onClose,
  query,
  onQuery,
  organizations,
  loading = false,
  selected,
  onSelect,
  onDetails,
}: {
  open: boolean;
  onClose: () => void;
  query: string;
  onQuery: (query: string) => void;
  organizations: DirectoryOrganization[];
  loading?: boolean;
  selected?: string;
  onSelect: (id: string) => void;
  onDetails: (id: string) => void;
}) {
  return (
    <aside
      id="map-organizations-drawer"
      className={`${styles.rail} ${drawer.drawer}`}
      data-side="left"
      inert={!open}
      aria-hidden={!open}
      data-open={open}
      aria-label="Map organizations"
      style={{
        height: loading
          ? 280
          : Math.min(520, 116 + Math.min(100, organizations.length) * 34),
      }}
    >
      <div className={styles.heading}>
        <span>Organizations</span>
        <small>{organizations.length.toLocaleString("en")}</small>
        <IconButton label="Close organizations" onClick={onClose}>
          <X size={16} />
        </IconButton>
      </div>
      <OrganizationSearch value={query} onChange={onQuery} />
      <OrganizationMapGrid
        organizations={organizations}
        loading={loading}
        selected={selected}
        onSelect={onSelect}
        onDetails={onDetails}
      />
    </aside>
  );
}

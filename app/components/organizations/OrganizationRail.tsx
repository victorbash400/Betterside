import OrganizationSearch from "./OrganizationSearch";
import RecordPagination from "../collections/RecordPagination";
import { useState } from "react";
import type { DirectoryOrganization } from "../../lib/organizations";
import OrganizationDirectoryRow from "./OrganizationDirectoryRow";
import drawer from "../map/MapDrawer.module.css";
import styles from "./OrganizationRail.module.css";
export default function OrganizationRail({
  open,
  query,
  onQuery,
  organizations,
  selected,
  onSelect,
  onDetails,
}: {
  open: boolean;
  query: string;
  onQuery: (query: string) => void;
  organizations: DirectoryOrganization[];
  selected?: string;
  onSelect: (id: string) => void;
  onDetails: (id: string) => void;
}) {
  const [requestedPage, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(organizations.length / 100));
  const page = Math.min(requestedPage, pages - 1);
  return (
    <aside
      id="map-organizations-drawer"
      className={`${styles.rail} ${drawer.drawer}`}
      data-side="left"
      inert={!open}
      aria-hidden={!open}
      data-open={open}
      aria-label="Map organizations"
    >
      <div className={styles.heading}>
        <span>Organizations</span>
        <small>{organizations.length.toLocaleString("en")}</small>
      </div>
      <OrganizationSearch
        value={query}
        onChange={(value) => {
          setPage(0);
          onQuery(value);
        }}
      />
      <div className={styles.scroll}>
        {organizations.slice(page * 100, (page + 1) * 100).map((org) => (
          <OrganizationDirectoryRow
            key={org.id}
            organization={org}
            selected={selected === org.id}
            onDetails={() => onDetails(org.id)}
            compact
            onSelect={() => onSelect(org.id)}
          />
        ))}
      </div>
      {pages > 1 && (
        <RecordPagination page={page} pages={pages} onPage={setPage} />
      )}
    </aside>
  );
}

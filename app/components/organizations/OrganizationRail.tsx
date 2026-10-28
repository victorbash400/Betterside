import OrganizationSearch from "./OrganizationSearch";
import RecordPagination from "../collections/RecordPagination";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { DirectoryOrganization } from "../../lib/organizations";
import OrganizationDirectoryRow from "./OrganizationDirectoryRow";
import { useNarrowLayout } from "../../state/useNarrowLayout";
import styles from "./OrganizationRail.module.css";
export default function OrganizationRail({
  query,
  onQuery,
  organizations,
  selected,
  onSelect,
  onDetails,
}: {
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
  const narrow = useNarrowLayout();
  const [expanded, setExpanded] = useState<boolean>();
  const open = expanded ?? !narrow;
  return (
    <aside
      className={styles.rail}
      data-open={open}
      aria-label="Map organizations"
    >
      <button
        className={styles.heading}
        aria-expanded={open}
        onClick={() => setExpanded(!open)}
      >
        <span>Organizations</span>
        <small>{organizations.length.toLocaleString("en")}</small>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <OrganizationSearch
          value={query}
          onChange={(value) => {
            setPage(0);
            onQuery(value);
          }}
        />
      )}
      {open && (
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
      )}
      {open && pages > 1 && (
        <RecordPagination page={page} pages={pages} onPage={setPage} />
      )}
    </aside>
  );
}

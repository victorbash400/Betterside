import { useState } from "react";
import type { DirectoryOrganization } from "../../lib/organizations";
import RecordPagination from "../collections/RecordPagination";
import OrganizationDirectoryRow from "./OrganizationDirectoryRow";
import styles from "./OrganizationList.module.css";
export default function OrganizationList({
  organizations,
  selected,
  onSelect,
}: {
  organizations: DirectoryOrganization[];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  const [requestedPage, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(organizations.length / 100));
  const page = Math.min(requestedPage, pages - 1);
  return (
    <section className={styles.list} aria-label="Organization directory">
      <div className={styles.scroll}>
        <div className={styles.header}>
          <span>Organization</span>
          <span>Operating areas</span>
          <span>Donate</span>
        </div>
        {organizations.slice(page * 100, (page + 1) * 100).map((org) => (
          <OrganizationDirectoryRow
            key={org.id}
            organization={org}
            selected={selected === org.id}
            onSelect={() => onSelect(org.id)}
          />
        ))}
      </div>
      {pages > 1 && (
        <RecordPagination page={page} pages={pages} onPage={setPage} />
      )}
    </section>
  );
}
